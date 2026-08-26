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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

    const result = await model.generateContent([promptText, ...contentsParts]);
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
