import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

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

export async function processarPdfsMultiplos(listaCaminhosPdfs) {
  const resultadoConsolidado = {
    nomeCurso: "",
    unidadesCurriculares: []
  };

  for (let index = 0; index < listaCaminhosPdfs.length; index++) {
    const caminho = listaCaminhosPdfs[index];
    console.log(`[PEUC] Processando arquivo ${index + 1}/${listaCaminhosPdfs.length}: ${caminho}`);

    const uploadResult = await fileManager.uploadFile(caminho, {
      mimeType: "application/pdf",
      displayName: `PCA_Parte_${index + 1}`
    });

    try {
      const prompt = `
        Analise a parte em anexo do Plano de Curso (PCA) do SENAI.
        Extraia o Nome do Curso e todas as Unidades Curriculares (UCs) presentes neste trecho específico.
        Para cada UC, extraia com precisão suas Capacidades e Conhecimentos/Conteúdos Formativos.
        NUNCA gere nomes genéricos fictícios como "Unidade Curricular 1".
      `;

      const result = await model.generateContent([
        uploadResult.file,
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

      await fileManager.deleteFile(uploadResult.file.name);
    } catch (err) {
      try { await fileManager.deleteFile(uploadResult.file.name); } catch (_) {}
      console.warn(`[PEUC] Erro na parte ${index + 1}:`, err.message);
    }
  }

  return resultadoConsolidado;
}
