import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo PDF não fornecido' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Pdf = buffer.toString('base64');

    const systemPrompt = `Você é um extrator de dados de Planos de Curso (PCA) do SENAI-PR.
Analise a estrutura visual do documento e extraia os campos com extrema precisão:

REGRAS RÍGIDAS DE CLASSIFICAÇÃO:
1. "categoria": Identifique o TIPO DA OFERTA (ex: "Aprendizagem Industrial", "Habilitação Técnica", "Aperfeiçoamento Profissional"). NUNCA COLOQUE O NOME DO CURSO AQUI.
2. "curso": Identifique o NOME REAL E ESPECÍFICO DO CURSO (ex: "Auxiliar de Linha de Produção", "Assistente Administrativo", "Eletricista Industrial"). NUNCA insira "Aprendizagem Industrial" neste campo.
3. "carga_horaria_total": Carga horária total (ex: "400h", "800h").
4. "unidades_curriculares": Extraia APENAS as disciplinas/módulos de ensino com carga horária.
   - REGRA ABSOLUTA: Descarte endereços, bairros, cidades, CEP, telefones, CNPJ e rodapés institucionais. Eles NÃO são unidades curriculares.

Responda EXCLUSIVAMENTE em formato JSON com a estrutura:
{
  "categoria": "Aprendizagem Industrial",
  "curso": "Auxiliar de Linha de Produção",
  "carga_horaria_total": "400h",
  "unidades_curriculares": [
    {
      "numero": 1,
      "nome": "Nome oficial da UC",
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
                { inlineData: { mimeType: 'application/pdf', data: base64Pdf } }
              ]
            }
          ],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        })
      }
    );

    const data = await response.json();
    const rawJson = data.candidates[0].content.parts[0].text;
    return NextResponse.json(JSON.parse(rawJson));
  } catch (error) {
    console.error('Erro no PDF:', error);
    return NextResponse.json({ error: 'Falha ao processar o PDF com a IA' }, { status: 500 });
  }
}
