import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { curso, uc, tipoSituacao, capacidades } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave GEMINI_API_KEY não configurada no ambiente.' },
        { status: 500 }
      );
    }

    const prompt = `Você é um especialista na Metodologia SENAI de Educação Profissional.
Elabore uma Estratégia de Aprendizagem Desafiadora do tipo "${tipoSituacao}" para a Unidade Curricular "${uc}" do curso "${curso}".

Considere as seguintes capacidades de referência:
${capacidades}

Responda EXCLUSIVAMENTE em formato JSON com a seguinte estrutura e sem marcação markdown externa (apenas o JSON puro):
{
  "contextualizacao": "Texto de contextualização do cenário da empresa ou indústria...",
  "desafio": "Descrição clara do desafio ou situação simulada que o estudante deve resolver...",
  "resultados_esperados": "Lista de entregáveis esperados (ex: relatórios, planilhas, diagramas)...",
  "criterios_qualidade": "Padrões técnicos, cognitivos e de segurança mínimos exigidos..."
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: 'application/json',
          },
        }),
      }
    );

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('Falha ao obter resposta do modelo.');
    }

    const parsedData = JSON.parse(resultText);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Erro na API Gerar Situação:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar situação com IA.' },
      { status: 500 }
    );
  }
}
