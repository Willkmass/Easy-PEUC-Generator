import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const schemaPEUC = {
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

export async function processarPdfsMultiplos(buffers) {
  const resultadoConsolidado = {
    nomeCurso: "",
    unidadesCurriculares: []
  };

  for (let index = 0; index < buffers.length; index++) {
    const item = buffers[index];

    // Envia o PDF via Base64 diretamente em memória para a API do Gemini
    const fileData = {
      inlineData: {
        data: item.buffer.toString('base64'),
        mimeType: item.mimeType
      }
    };

    try {
      const prompt = `
        Analise a parte em anexo do Plano de Curso (PCA) do SENAI.
        Extraia o Nome do Curso e todas as Unidades Curriculares (UCs) presentes neste trecho específico.
        Para cada UC, extraia com precisão suas Capacidades e Conhecimentos/Conteúdos Formativos.
        NUNCA gere nomes genéricos fictícios como "Unidade Curricular 1".
      `;

      const result = await model.generateContent([
        fileData,
        { text: prompt }
      ]);

      const parcial = JSON.parse(result.response.text());

      if (parcial.nomeCurso && !resultadoConsolidado.nomeCurso) {
        resultadoConsolidado.nomeCurso = parcial.nomeCurso;
      }

      if (parcial.unidadesCurriculares?.length > 0) {
        for (const ucNova of parcial.unidadesCurriculares) {
          if (!ucNova.nomeUc || /^unidade\s+curricular\s+\d+$/i.test(ucNova.nomeUc.trim())) continue;

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
    } catch (err) {
      console.warn(`[PEUC] Erro no processamento da parte ${index + 1}:`, err?.message);
    }
  }

  return resultadoConsolidado;
}
