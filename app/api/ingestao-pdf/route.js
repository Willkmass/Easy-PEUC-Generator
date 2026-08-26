import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

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

    let result;
    try {
      // Primeira tentativa de geração
      result = await model.generateContent([promptText, ...contentsParts]);
    } catch (apiErr) {
      // Se der 503 (instabilidade momentânea do servidor do Google), tenta novamente em 2 segundos
      if (apiErr?.message?.includes('503') || apiErr?.status === 503) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        result = await model.generateContent([promptText, ...contentsParts]);
      } else {
        throw apiErr;
      }
    }

    const responseText = result.response.text();

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
