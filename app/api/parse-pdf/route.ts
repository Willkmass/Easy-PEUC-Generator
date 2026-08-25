import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo PDF não fornecido' }, { status: 400 });
    }

    // Converte o arquivo PDF em Base64 para envio direto à API de visão
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Pdf = buffer.toString('base64');

    const systemPrompt = `Você é um especialista em análise visual de Planos de Curso (PCA) do SENAI-PR.
Analise a estrutura visual das tabelas deste PDF e extraia os dados exatamente como aparecem visualmente.

Regras Estritas de Extração:
1. "curso": Extraia o nome exato do curso indicado no cabeçalho/título principal.
2. "carga_horaria_total": Carga horária total do curso (ex: "600h").
3. "unidades_curriculares": Extraia APENAS disciplinas/módulos de ensino com carga horaria.
   - Ignore completamente endereços, CEP, telefones, CNPJ ou rodapés institucionais.
4. Para cada UC, separe:
   - "capacidades": Frases com verbos no infinitivo.
   - "conhecimentos": Tópicos e conteúdos programáticos.

Responda EXCLUSIVAMENTE em formato JSON:
{
  "curso": "Nome do Curso",
  "carga_horaria_total": "600h",
  "unidades_curriculares": [
    {
      "numero": 1,
      "nome": "Nome da UC",
      "carga_horaria": 40,
      "capacidades": ["Capacidade 1", "Capacidade 2"],
      "conhecimentos": ["Conhecimento 1", "Conhecimento 2"]
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
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Pdf
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      }
    );

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Resposta inválida do modelo de IA');
    }

    const rawJson = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(rawJson);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Erro no processamento do PDF via IA:', error);
    return NextResponse.json({ error: 'Falha ao processar o PDF com a IA' }, { status: 500 });
  }
}
