import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lista sequencial com as versões atuais e ativas da API
const MODELOS_ATIVOS = [
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-2.5-flash'
];

export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Chave GEMINI_API_KEY não configurada no ambiente.' 
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());

    const formData = await req.formData();
    const arquivos = formData.getAll('arquivos');

    if (!arquivos || arquivos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado.' },
        { status: 400 }
      );
    }

    const contentsParts = [];

    for (const file of arquivos) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Data = buffer.toString('base64');

      contentsParts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'application/pdf',
        },
      });
    }

    const promptText = `
    Analise o documento fornecido (que pode ser um Plano de Curso - PCA ou uma parte fatiada dele).
    Extraia as informações estruturadas RIGOROSAMENTE na forma de um JSON.

    Se alguma informação não for encontrada nesta parte específica, retorne o array vazio ou string vazia, mas MANTENHA a estrutura JSON.

    Estrutura JSON Esperada:
    {
      "nomeCurso": "Nome do curso (se identificado)",
      "unidadesCurriculares": [
        {
          "nomeUc": "Nome da Unidade Curricular / Disciplina",
          "cargaHoraria": "Carga horária ex: 80h",
          "capacidades": ["Capacidade 1", "Capacidade 2"],
          "conhecimentos": ["Conhecimento 1", "Conhecimento 2"]
        }
      ]
    }

    IMPORTANTE: Retorne APENAS o JSON puro, sem blocos de texto ou marcações de código como \`\`\`json.
    `;

    let responseText = null;
    let ultimoErro = null;

    // Tenta os modelos da lista sequencialmente até obter resposta com sucesso
    for (const nomeModelo of MODELOS_ATIVOS) {
      try {
        const model = genAI.getGenerativeModel({ model: nomeModelo });
        const result = await model.generateContent([promptText, ...contentsParts]);
        responseText = result.response.text();

        if (responseText) {
          console.log(`[Gemini Ingestion] Processado com sucesso no modelo: ${nomeModelo}`);
          break;
        }
      } catch (err) {
        console.warn(`[Gemini Ingestion] Falha no modelo ${nomeModelo}:`, err?.message || err);
        ultimoErro = err;
      }
    }

    if (!responseText) {
      throw ultimoErro || new Error('Nenhum dos modelos disponíveis respondeu à requisição.');
    }

    const cleanJson = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const data = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Erro na rota de Ingestão de PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Falha ao processar o documento.',
      },
      { status: 500 }
    );
  }
}
