import fs from 'fs';
import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Schema simplificado para extrair APENAS o contéudo do bloco atual (sem retransmitir o histórico)
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

export async function processarPdfEmLotes(caminhoPdf, paginasPorBloco = 8) {
  const dataBuffer = fs.readFileSync(caminhoPdf);
  const data = await pdfParse(dataBuffer);
  
  const totalPaginas = data.numpages;
  const linhasTexto = data.text.split('\n');
  const linhasPorBloco = Math.ceil(linhasTexto.length / Math.ceil(totalPaginas / paginasPorBloco));
  
  const resultadoConsolidado = {
    curso: "",
    unidadesCurriculares: []
  };

  for (let i = 0; i < linhasTexto.length; i += linhasPorBloco) {
    const blocoTexto = linhasTexto.slice(i, i + linhasPorBloco).join('\n');
    
    if (!blocoTexto.trim()) continue;

    const prompt = `
      Você é o motor de extração de dados do sistema PEUC.
      Analise EXCLUSIVAMENTE o trecho abaixo e extraia as informações encontradas:

      TRECHO A ANALISAR:
      """
      ${blocoTexto}
      """

      INSTRUÇÕES:
      1. Extraia o nome do curso caso apareça neste trecho.
      2. Mapeie todas as Unidades Curriculares (UCs), suas cargas horárias, capacidades e conhecimentos presentes no trecho.
    `;

    try {
      const result = await model.generateContent(prompt);
      const blocoExtraido = JSON.parse(result.response.text());

      // 1. Atualiza nome do curso se encontrado
      if (blocoExtraido.nomeCurso && !resultadoConsolidado.curso) {
        resultadoConsolidado.curso = blocoExtraido.nomeCurso;
      }

      // 2. Unifica os dados no Node.js sem sobrecarregar a resposta da IA
      if (blocoExtraido.unidadesCurriculares?.length > 0) {
        for (const ucNova of blocoExtraido.unidadesCurriculares) {
          const ucExistente = resultadoConsolidado.unidadesCurriculares.find(
            u => u.nomeUc.toLowerCase().trim() === ucNova.nomeUc.toLowerCase().trim()
          );

          if (ucExistente) {
            // Mescla capacidades e conhecimentos sem duplicar
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
      console.warn(`[Aviso] Falha ao processar bloco. Continuando... Erro: ${e.message}`);
    }
  }

  return resultadoConsolidado;
}
