import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
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

// Helper para converter PDF fatiado em texto puro sem estourar RAM
function lerTextoDoChunk(bufferChunk) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataError", err => reject(err));
    pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
    pdfParser.parseBuffer(bufferChunk);
  });
}

export async function processarPdfEmLotes(caminhoPdf, paginasPorBloco = 10) {
  const pdfBytes = fs.readFileSync(caminhoPdf);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPaginas = pdfDoc.getPageCount();

  const resultadoConsolidado = {
    curso: "",
    unidadesCurriculares: []
  };

  // Divide o PDF em arquivos temporários menores no disco/memória
  for (let i = 0; i < totalPaginas; i += paginasPorBloco) {
    const fim = Math.min(i + paginasPorBloco, totalPaginas);
    
    // Cria um novo PDF contendo APENAS o bloco de páginas atual (ex: 1 a 10)
    const novoSubPdf = await PDFDocument.create();
    const paginasCopiadas = await novoSubPdf.copyPages(pdfDoc, Array.from({ length: fim - i }, (_, index) => i + index));
    paginasCopiadas.forEach(page => novoSubPdf.addPage(page));
    
    const chunkBytes = await novoSubPdf.save();
    const textoDoBloco = await lerTextoDoChunk(Buffer.from(chunkBytes));

    if (!textoDoBloco.trim()) continue;

    const prompt = `
      Você é o motor de ingestão do banco do PEUC.
      Extraia as informações do trecho a seguir (Páginas ${i + 1} a ${fim} de ${totalPaginas}):

      TRECHO A ANALISAR:
      """
      ${textoDoBloco}
      """
    `;

    try {
      const result = await model.generateContent(prompt);
      const blocoExtraido = JSON.parse(result.response.text());

      // 1. Atualiza nome do Curso
      if (blocoExtraido.nomeCurso && !resultadoConsolidado.curso) {
        resultadoConsolidado.curso = blocoExtraido.nomeCurso;
      }

      // 2. Mescla UCs no objeto final sem estourar o limite da API
      if (blocoExtraido.unidadesCurriculares?.length > 0) {
        for (const ucNova of blocoExtraido.unidadesCurriculares) {
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
      console.warn(`[Aviso] Erro no bloco de páginas ${i + 1}-${fim}: ${e.message}`);
    }
  }

  return resultadoConsolidado;
}
