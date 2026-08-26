import fs from 'fs';
import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define a estrutura JSON estrita para forçar a IA a responder sem erros de sintaxe
const schemaPEUC = {
  type: SchemaType.OBJECT,
  properties: {
    curso: { type: SchemaType.STRING },
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
  required: ["curso", "unidadesCurriculares"]
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schemaPEUC
  }
});

export async function processarPdfEmLotes(caminhoPdf, paginasPorBloco = 10) {
  const dataBuffer = fs.readFileSync(caminhoPdf);
  const data = await pdfParse(dataBuffer);
  
  const totalPaginas = data.numpages;
  // Divide o texto total em blocos aproximados por quantidade de páginas
  const linhasTexto = data.text.split('\n');
  const linhasPorBloco = Math.ceil(linhasTexto.length / Math.ceil(totalPaginas / paginasPorBloco));
  
  let dadosAcumulados = { curso: "", unidadesCurriculares: [] };

  for (let i = 0; i < linhasTexto.length; i += linhasPorBloco) {
    const blocoTexto = linhasTexto.slice(i, i + linhasPorBloco).join('\n');
    
    if (!blocoTexto.trim()) continue;

    const prompt = `
      Atue como motor de ingestão do banco PEUC.
      
      ESTADO ATUAL DO BANCO:
      ${JSON.stringify(dadosAcumulados)}

      NOVO TRECHO A PROCESSAR:
      """
      ${blocoTexto}
      """

      INSTRUÇÕES:
      1. Extraia o nome do Curso (se identificado neste bloco ou mantenha o anterior).
      2. Adicione ou atualize as Unidades Curriculares (UCs), mapeando Capacidades e Conhecimentos.
      3. Consolide os dados novos com o ESTADO ATUAL sem duplicar registros.
    `;

    try {
      const result = await model.generateContent(prompt);
      const respostaTexto = result.response.text();
      dadosAcumulados = JSON.parse(respostaTexto);
    } catch (e) {
      console.warn(`[Aviso] Falha ao processar bloco de texto. Mantendo estado anterior. Erro: ${e.message}`);
    }
  }

  return dadosAcumulados;
}
