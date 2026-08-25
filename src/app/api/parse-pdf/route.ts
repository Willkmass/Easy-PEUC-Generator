import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 });
    }

    const systemPrompt = `Você é um parser especializado em Planos de Curso de Aprendizagem (PCA) do SENAI.
Extraia as informações do texto e responda EXCLUSIVAMENTE em formato JSON com a seguinte estrutura:
{
  "curso": "nome do curso",
  "carga_horaria_total": "carga horaria ex: 600h",
  "unidades_curriculares": [
    {
      "numero": 1,
      "nome": "nome da UC",
      "carga_horaria": 20,
      "capacidades": ["capacidade 1"],
      "conhecimentos": ["conhecimento 1"]
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nTexto do PDF:\n${text}` }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      }
    );

    const data = await response.json();
    const rawJson = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(rawJson);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json({ error: 'Falha ao processar o PDF com a IA' }, { status: 500 });
  }
}
