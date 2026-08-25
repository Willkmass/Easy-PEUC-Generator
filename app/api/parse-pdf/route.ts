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
Sua missão é extrair com precisão os dados do Plano de Curso (PCA) fornecido em imagem.

REGRAS ESTRITAS DE EXTRAÇÃO:
1. "categoria": Informe apenas a modalidade/categoria pedagógica (ex: "Aprendizagem Industrial", "Habilitação Técnica", "Qualificação Profissional"). NUNCA coloque o nome do curso aqui.
2. "curso": Informe APENAS o nome oficial do curso/ocupação (ex: "Auxiliar de Linha de Produção", "Assistente Administrativo"). NUNCA inclua a categoria aqui.
3. "carga_horaria_total": Carga horária total no formato "XXXh" (ex: "400h").
4. "unidades_curriculares": Lista de UCs encontradas. Ignore rodapés, CNPJ, endereços e nomes de unidades físicas do SENAI.

Responda EXCLUSIVAMENTE em formato JSON puro, sem blocos de texto adicionais:
{
  "categoria": "Aprendizagem Industrial",
  "curso": "Auxiliar de Linha de Produção",
  "carga_horaria_total": "400h",
  "unidades_curriculares": [
    {
      "numero": 1,
      "nome": "Nome da Unidade Curricular",
      "carga_horaria": 40,
      "capacidades": ["Capacidade 1", "Capacidade 2"],
      "conhecimentos": ["Conhecimento 1", "Conhecimento 2"]
    }
  ]
}`;

    const parts: any[] = [{ text: systemPrompt }];
    images.forEach((imgBase64: string) => {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: imgBase64,
        },
      });
    });

    // Chamada à API oficial utilizando o modelo estável v1beta
    // Nota: Caso prefira a linha v1.5 estável, basta alterar o nome para gemini-1.5-flash
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseMimeType: 'application/json',
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

    const rawJsonText = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(rawJsonText);

    // 1. Inserção do Curso na tabela 'cursos'
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

    // 2. Inserção das UCs vinculadas na tabela 'unidades_curriculares'
    if (parsedData.unidades_curriculares && parsedData.unidades_curriculares.length > 0) {
      const ucsPayload = parsedData.unidades_curriculares.map((uc: any) => ({
        curso_id: cursoCriado.id,
        numero: uc.numero || 1,
        nome: uc.nome,
        carga_horaria: uc.carga_horaria || 0,
        capacidades: uc.capacidades || [],
        conhecimentos: uc.conhecimentos || [],
      }));

      const { error: erroUC } = await supabase.from('unidades_curriculares').insert(ucsPayload);
      if (erroUC) {
        console.error('Erro ao inserir UCs:', erroUC.message);
      }
    }

    return NextResponse.json({
      sucesso: true,
      curso: cursoCriado,
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
