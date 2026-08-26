import fs from 'fs';
import PDFParser from 'pdf2json';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const schemaBloco = {
  type: SchemaType.OBJECT,
  properties: {
    nomeCurso: { type: SchemaType.STRING },
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
  }
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schemaBloco
  }
});

// Função para extrair texto preservando layout de tabelas
function extrairTextoPdf(caminhoPdf) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", () => {
      resolve(pdfParser.getRawTextContent());
    });
    pdfParser.loadPDF(caminhoPdf);
  });
}

export async function processarPdfEmLotes(caminhoPdf, tamanhoFatimoLinhas = 150) {
  // 1. Extração robusta do texto do PDF
  const textoBruto = await extrairTextoPdf(caminhoPdf);
  const linhasTexto = textoBruto.split('\n');
  
  const resultadoConsolidado = {
    curso: "",
    unidadesCurriculares: []
  };

  // 2. Fatiamento por volume de linhas
  for (let i = 0; i < linhasTexto.length; i += tamanhoFatimoLinhas) {
    const blocoTexto = linhasTexto.slice(i, i + tamanhoFatimoLinhas).join('\n');
    if (!blocoTexto.trim()) continue;

    const prompt = `
      Você é o motor de ingestão do banco do PEUC.
      Extraia estritamente os dados presentes no trecho a seguir.
      ATENÇÃO: Não invente nomes genéricos como "Unidade Curricular 1" se o nome real da UC não estiver explícito.

      TRECHO A ANALISAR:
      """
      ${blocoTexto}
      """
    `;

    try {
      const result = await model.generateContent(prompt);
      const blocoExtraido = JSON.parse(result.response.text());

      if (blocoExtraido.nomeCurso && !resultadoConsolidado.curso) {
        resultadoConsolidado.curso = blocoExtraido.nomeCurso;
      }

      if (blocoExtraido.unidadesCurriculares?.length > 0) {
        for (const ucNova of blocoExtraido.unidadesCurriculares) {
          // Ignores nomes genéricos criados por erro de parser
          if (!ucNova.nomeUc || ucNova.nomeUc.toLowerCase().includes("unidade curricular 1")) continue;

          const ucExistente = resultadoConsolidado.unidadesCurriculares.find(
            u => u.nomeUc.toLowerCase().trim() === ucNova.nomeUc.toLowerCase().trim()
          );

          if (ucExistente) {
            if (ucNova.capacidades) {
              ucExistente.capacidades = [...new Set([...(ucExistente.capacidades || []), ...ucNova.capacidades])];
            }
            if (ucNova.conhecimentos) {
              ucExistente.conhecimentos = [...new Set([...(ucExistente.conhecimentos || []), ...ucNova.conhecimentos])];
            }
            if (ucNova.cargaHoraria && !ucExistente.cargaHoraria) {
              ucExistente.cargaHoraria = ucNova.cargaHoraria;
            }
          } else {
            resultadoConsolidado.unidadesCurriculares.push(ucNova);
          }
        }
      }
    } catch (e) {
      console.warn(`[Aviso] Falha ao processar bloco: ${e.message}`);
    }
  }

  return resultadoConsolidado;
}
