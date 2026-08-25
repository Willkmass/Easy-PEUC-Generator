import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { images } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 });
    }

    const systemPrompt = `Você é um especialista em extração de Planos de Curso (PCA) do SENAI-PR.
Analise a estrutura das imagens e extraia estritamente os campos solicitados.

REGRAS RÍGIDAS DE SEPARAÇÃO:
1. "categoria": Apenas a modalidade da oferta (ex: "Aprendizagem Industrial", "Habilitação Técnica", "Aperfeiçoamento Profissional"). NUNCA insira o nome do curso aqui.
2. "curso": Apenas o NOME REAL DA OCUPAÇÃO/CURSO (ex: "Auxiliar de Linha de Produção", "Assistente Administrativo"). NUNCA insira termos como "Aprendizagem Industrial" neste campo.
3. "carga_horaria_total": Carga horária total (ex: "400h").
4. "unidades_curriculares": Apenas disciplinas com carga horária. Ignore endereços, telefones, CNPJ e CEP.

Responda EXCLUSIVAMENTE em formato JSON:
{
  "categoria": "Aprendizagem Industrial",
  "curso": "Auxiliar de Linha de Produção",
  "carga_horaria_total": "400h",
  "unidades_curriculares": [
    {
      "numero": 1,
      "nome": "Nome oficial da UC",
      "carga_horaria": 40,
      "capacidades": ["Capacidade 1"],
      "conhecimentos": ["Conhecimento 1"]
    }
  ]
}`;

    const parts: any[] = [{ text: systemPrompt }];
    images.forEach((img: string) => {
      parts.push({ inlineData: { mimeType: 'image/png', data: img } });
    });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        })
      }
    );

    const data = await geminiRes.json();
    const rawJson = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(rawJson);

    // 1. Grava o Curso com a Categoria no Supabase
    const { data: cursoBanco, error: cursoErr } = await supabase
      .from('cursos')
      .insert({
        nome: parsedData.curso,
        categoria: parsedData.categoria,
        carga_horaria_total: parsedData.carga_horaria_total
      })
      .select()
      .single();

    if (cursoErr) throw cursoErr;

    // 2. Grava as Unidades Curriculares vinculadas ao Curso
    if (parsedData.unidades_curriculares?.length > 0) {
      const ucsParaInserir = parsedData.unidades_curriculares.map((uc: any) => ({
        curso_id: cursoBanco.id,
        numero: uc.numero,
        nome: uc.nome,
        carga_horaria: uc.carga_horaria,
        capacidades: uc.capacidades || [],
        conhecimentos: uc.conhecimentos || []
      }));

      const { error: ucErr } = await supabase.from('unidades_curriculares').insert(ucsParaInserir);
      if (ucErr) console.error('Erro ao salvar UCs:', ucErr);
    }

    return NextResponse.json({ sucesso: true, curso: cursoBanco, dadosExtraidos: parsedData });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Erro ao processar e salvar no banco' }, { status: 500 });
  }
}
