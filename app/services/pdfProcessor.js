import fs from 'fs';
import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function processarPdfEmLotes(caminhoPdf, paginasPorBloco = 10) {
  const dataBuffer = fs.readFileSync(caminhoPdf);
  const data = await pdfParse(dataBuffer);
  
  const totalPaginas = data.numpages;
  let dadosAcumulados = [];

  for (let inicio = 1; inicio <= totalPaginas; inicio += paginasPorBloco) {
    const fim = Math.min(inicio + paginasPorBloco - 1, totalPaginas);
    
    const dadosPagina = await pdfParse(dataBuffer, {
      pagerender: (pageData) => {
        const pageIndex = pageData.pageIndex + 1;
        if (pageIndex >= inicio && pageIndex <= fim) {
          return pageData.getTextContent().then(textContent => {
            return textContent.items.map(item => item.str).join(' ');
          });
        }
        return '';
      }
    });

    const prompt = `
      Você é o motor de ingestão de banco de dados do sistema PEUC.
      
      ESTADO ATUAL DO BANCO:
      ${JSON.stringify(dadosAcumulados)}

      NOVO TRECHO (Páginas ${inicio} a ${fim} de ${totalPaginas}):
      """
      ${dadosPagina.text}
      """

      INSTRUÇÕES DE SAÍDA:
      1. Extraia a hierarquia: Curso -> UC -> Capacidades/Conhecimentos.
      2. Mantenha os dados anteriores e incremente com o novo trecho.
      3. Retorne EXCLUSIVAMENTE um objeto JSON válido.
    `;

    const result = await model.generateContent(prompt);
    const respostaTexto = result.response.text();
    
    try {
      const jsonLimpo = respostaTexto.replace(/```json|```/g, '').trim();
      dadosAcumulados = JSON.parse(jsonLimpo);
    } catch (e) {
      console.warn(`[Aviso] Falha no parse do bloco ${inicio}-${fim}. Mantendo histórico.`);
    }
  }

  return dadosAcumulados;
}
