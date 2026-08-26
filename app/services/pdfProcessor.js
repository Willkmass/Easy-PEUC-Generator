import fs from 'fs';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// 1. Schema para extrair a lista inicial de UCs (leve e sem risco de truncar)
const schemaMatriz = {
  type: SchemaType.OBJECT,
  properties: {
    nomeCurso: { type: SchemaType.STRING },
    cargaHorariaTotal: { type: SchemaType.STRING },
    unidadesCurriculares: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          nomeUc: { type: SchemaType.STRING },
          cargaHoraria: { type: SchemaType.STRING }
        },
        required: ["nomeUc"]
      }
    }
  },
  required: ["nomeCurso", "unidadesCurriculares"]
};

// 2. Schema para extrair o detalhamento completo de UMA UC por vez
const schemaDetalhesUC = {
  type: SchemaType.OBJECT,
  properties: {
    capacidades: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    conhecimentos: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
  },
  required: ["capacidades", "conhecimentos"]
};

export async function processarPdfEmLotes(caminhoPdf) {
  console.log("[PEUC] Fazendo upload do PDF nativo para o Gemini...");
  const uploadResult = await fileManager.uploadFile(caminhoPdf, {
    mimeType: "application/pdf",
    displayName: "PCA_Document",
  });

  try {
    // modelo configurado para a Etapa 1
    const modelMatriz = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schemaMatriz
      }
    });

    console.log("[PEUC] Etapa 1: Lendo Matriz Curricular do Curso...");
    const promptMatriz = `
      Analise o PDF do PCA do SENAI anexado.
      Extraia o nome do curso e a lista completa com TODAS as Unidades Curriculares (UCs) e suas cargas horárias.
      Ignore introduções, capa e sumário genérico.
    `;

    const resMatriz = await modelMatriz.generateContent([
      uploadResult.file,
      { text: promptMatriz }
    ]);

    const resultadoFinal = JSON.parse(resMatriz.response.text());

    // Modelo configurado para a Etapa 2
    const modelDetalhes = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schemaDetalhesUC
      }
    });

    console.log(`[PEUC] Etapa 2: Mapeando detalhamento de ${resultadoFinal.unidadesCurriculares.length} UCs...`);

    // Processa os detalhes de cada UC individualmente para evitar truncar o JSON
    for (let i = 0; i < resultadoFinal.unidadesCurriculares.length; i++) {
      const uc = resultadoFinal.unidadesCurriculares[i];
      console.log(`[PEUC] Processando detalhes da UC ${i + 1}/${resultadoFinal.unidadesCurriculares.length}: ${uc.nomeUc}`);

      const promptDetalhes = `
        No PDF anexado, localize a seção de detalhamento da Unidade Curricular: "${uc.nomeUc}".
        Extraia com precisão:
        1. Todas as Capacidades (técnicas e socioemocionais).
        2. Todos os Conhecimentos / Conteúdos Formativos listados para esta UC.
      `;

      try {
        const resDetalhes = await modelDetalhes.generateContent([
          uploadResult.file,
          { text: promptDetalhes }
        ]);

        const detalhesParsed = JSON.parse(resDetalhes.response.text());
        uc.capacidades = detalhesParsed.capacidades || [];
        uc.conhecimentos = detalhesParsed.conhecimentos || [];
      } catch (errUC) {
        console.warn(`[PEUC] Falha ao extrair detalhes da UC "${uc.nomeUc}":`, errUC.message);
        uc.capacidades = [];
        uc.conhecimentos = [];
      }
    }

    // Deleta o arquivo temporário dos servidores do Google
    await fileManager.deleteFile(uploadResult.file.name);
    return resultadoFinal;

  } catch (error) {
    try { await fileManager.deleteFile(uploadResult.file.name); } catch (_) {}
    console.error("[PEUC] Erro no processamento de PDFs:", error);
    throw error;
  }
}
