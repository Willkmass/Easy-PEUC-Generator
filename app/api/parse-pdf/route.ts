import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { images } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Nenhuma imagem do PDF foi enviada.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A variável GEMINI_API_KEY não está configurada no ambiente/Vercel.' },
        { status: 500 }
      );
    }

    const systemPrompt = `Você é um especialista em análise pedagógica do SENAI-PR.
Sua missão é extrair com precisão os dados do Plano de Curso (PCA) fornecido em imagens.

REGRAS ESTRITAS DE EXTRAÇÃO:
1. "categoria": Apenas a modalidade pedagógica (ex: "Aprendizagem Industrial", "Habilitação Técnica").
2. "curso": APENAS o nome oficial do curso/ocupação (ex: "Assistente Administrativo").
3. "carga_horaria_total": Formato "XXXh" (ex: "600h").
4. "unidades_curriculares": Extraia TODAS as Unidades Curriculares (UC1, UC2, etc.) presentes no documento. É OBRIGATÓRIO extrair ao menos as UCs presentes na Matriz Curricular.

REGRA DE PREENCHIMENTO DE UCS:
- Se "capacidades" ou "conhecimentos" não constarem no PDF para alguma UC, preencha com array vazio [].
- NUNCA retorne a lista "unidades_curriculares" vazia.`;

    const parts: any[] = [{ text: systemPrompt }];

    images.forEach((imgBase64: string) => {
      const mimeMatch = imgBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const cleanBase64 = imgBase64.replace(/^data:image\/\w+;base64,/, '');

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64,
        },
      });
    });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192,
            responseSchema: {
              type: 'OBJECT',
              properties: {
                categoria: { type: 'STRING' },
                curso: { type: 'STRING' },
                carga_horaria_total: { type: 'STRING' },
                unidades_curriculares: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      numero: { type: 'INTEGER' },
                      nome: { type: 'STRING' },
                      carga_horaria: { type: 'INTEGER' },
                      capacidades: { 
                        type: 'ARRAY', 
                        items: { type: 'STRING' }
                      },
                      conhecimentos: { 
                        type: 'ARRAY', 
                        items: { type: 'STRING' }
                      },
                    },
                    required: ['nome'],
                  },
                },
              },
              required: ['categoria', 'curso', 'carga_horaria_total', 'unidades_curriculares'],
            },
            temperature: 0.1,
          },
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok || !data.candidates || data.candidates.length === 0) {
      const msgErro = data.error?.message || 'Falha na resposta da API Gemini.';
      return NextResponse.json({ error: `Erro no Gemini: ${msgErro}` }, { status: 500 });
    }

    const parsedData = JSON.parse(data.candidates[0].content.parts[0].text);

    // Validação extra: Bloqueia a gravação se não encontrou UCs
    if (!parsedData.unidades_curriculares || parsedData.unidades_curriculares.length === 0) {
      return NextResponse.json(
        { error: 'A IA não conseguiu identificar nenhuma Unidade Curricular nas imagens enviadas.' },
        { status: 422 }
      );
    }

    // 1. Grava o Curso no Supabase
    const { data: cursoCriado, error: erroCurso } = await supabase
      .from('cursos')
      .insert({
        nome: parsedData.curso,
        categoria: parsedData.categoria,
        carga_horaria_total: parsedData.carga_horaria_total,
      })
      .select()
      .single();

    if (erroCurso) {
      return NextResponse.json({ error: `Erro ao salvar curso no Supabase: ${erroCurso.message}` }, { status: 500 });
    }

    // 2. Grava as Unidades Curriculares vinculadas ao Curso
    const ucsPayload = parsedData.unidades_curriculares.map((uc: any, index: number) => ({
      curso_id: cursoCriado.id,
      numero: uc.numero || index + 1,
      nome: uc.nome || `Unidade Curricular ${index + 1}`,
      carga_horaria: uc.carga_horaria || 0,
      capacidades: uc.capacidades || [],
      conhecimentos: uc.conhecimentos || [],
    }));

    const { error: erroUC } = await supabase.from('unidades_curriculares').insert(ucsPayload);

    if (erroUC) {
      // Rollback: exclui o curso para não deixar o cadastro quebrado (0 UCs)
      await supabase.from('cursos').delete().eq('id', cursoCriado.id);
      return NextResponse.json({ error: `Erro ao salvar UCs no Supabase: ${erroUC.message}` }, { status: 500 });
    }

    return NextResponse.json({
      sucesso: true,
      curso: cursoCriado,
      total_ucs: ucsPayload.length,
      dados: parsedData,
    });
  } catch (err: any) {
    console.error('Erro geral no endpoint parse-pdf:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar e salvar no banco.' },
      { status: 500 }
    );
  }
}
