import fs from 'fs';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

const schemaPEUC = {
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
          cargaHoraria: { type: SchemaType.STRING },
          capacidades: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          },
          conhecimentos: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          }
        },
        required: ["nomeUc"]
      }
    }
  },
  required: ["nomeCurso", "unidadesCurriculares"]
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schemaPEUC
  }
});

export async function processarPdfEmLotes(caminhoPdf) {
  console.log("[PEUC] Fazendo upload do PDF nativo para o Gemini File API...");
  
  // 1. Envia o arquivo PDF completo direto para a API do Google (sem depender de libs locais de texto)
  const uploadResult = await fileManager.uploadFile(caminhoPdf, {
    mimeType: "application/pdf",
    displayName: "PCA_Document",
  });

  console.log(`[PEUC] Arquivo enviado com sucesso. URI: ${uploadResult.file.uri}`);

  const prompt = `
    Você é o extrator especializado de Planos de Curso (PCA) do SENAI para o sistema PEUC.
    Analise o documento PDF completo em anexo.

    REGRAS RÍGIDAS DE EXTRAÇÃO:
    1. Localize a Matriz Curricular e extraia TODAS as Unidades Curriculares (UCs) reais.
    2. NUNCA gere nomes genéricos como "Unidade Curricular 1", "UC 1" ou "Unidade 1" se o nome exato não existir.
    3. Para cada UC, leia as tabelas de detalhamento e extraia:
       - Carga Horária (ex: "80h", "160h").
       - Lista exata das Capacidades (Técnicas e Socioemocionais).
       - Lista exata dos Conhecimentos / Conteúdo Formativo.
    4. Se o documento contiver 12 UCs, retorne exatamente as 12 UCs preenchidas com seus respectivos conhecimentos.
  `;

  try {
    console.log("[PEUC] Processando estrutura pedagógica e tabelas...");
    const result = await model.generateContent([
      uploadResult.file,
      { text: prompt }
    ]);

    const resultadoJson = JSON.parse(result.response.text());

    // Limpeza de segurança no backend para garantir que lixo não vá pro Supabase
    resultadoJson.unidadesCurriculares = resultadoJson.unidadesCurriculares.filter(uc => {
      const nomeValido = uc.nomeUc && !/^unidade\s+curricular\s+\d+$/i.test(uc.nomeUc.trim());
      return nomeValido;
    });

    // 2. Limpa o arquivo dos servidores do Google após o processamento
    await fileManager.deleteFile(uploadResult.file.name);

    return resultadoJson;

  } catch (error) {
    console.error("[PEUC] Erro fatal no processamento nativo:", error);
    // Garante limpeza do arquivo em caso de erro
    try { await fileManager.deleteFile(uploadResult.file.name); } catch (_) {}
    throw error;
  }
}
