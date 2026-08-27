import { NextResponse } from 'next/server';

const MODELOS_ATIVOS = [
  'gemini-3.5-flash-lite', // 1ª opção (principal)
  'gemini-3.6-flash',      // 2ª opção (reserva 1)
  'gemini-2.5-flash'       // 3ª opção (reserva 2)
];

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

    let resultText = null;
    let ultimoErro = null;

    // Tenta sequencialmente os modelos ativos
    for (const modelo of MODELOS_ATIVOS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
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

        if (!response.ok) {
          throw new Error(data?.error?.message || `Erro HTTP ${response.status}`);
        }

        resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (resultText) {
          console.log(`[Gemini] Processado com sucesso no modelo: ${modelo}`);
          break; // Sucesso, sai do loop
        }
      } catch (err: any) {
        console.warn(`[Gemini] Falha no modelo ${modelo}:`, err?.message || err);
        ultimoErro = err;
      }
    }

    if (!resultText) {
      throw ultimoErro || new Error('Nenhum dos modelos disponíveis respondeu à requisição.');
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
