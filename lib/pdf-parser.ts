import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export function cleanPDFText(text: string): string {
  return text
    // 1. Remove cabeçalhos institucionais e marcas d'água
    .replace(/Sistema\s+FIEP|SENAI|Plano\s+de\s+Curso\s+de\s+Aprendizagem/gi, '')
    .replace(/Pág(?:ina)?\.?\s*\d+\s*(?:de|\/)\s*\d+/gi, '')
    .replace(/\b\d+\s+de\s+\d+\b/gi, '')
    
    // 2. Remove rigorosamente Endereços, CEP, Bairros e Telefones (impede virar UC)
    .replace(/(?:Rua|Av\.|Avenida|Alameda|Praça|Rodovia)\s+[^,\n]+,\s*\d+/gi, '')
    .replace(/Bairro:?\s*[^,\n]+/gi, '')
    .replace(/CEP:?\s*\d{5}-?\d{3}/gi, '')
    .replace(/(?:Curitiba|Londrina|Maringá|Ponta Grossa|Cascavel|São José dos Pinhais)\s*-\s*PR/gi, '')
    .replace(/CNPJ:?\s*\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/gi, '')
    .replace(/(?:tel|fone|fax):?\s*\(?\d{2}\)?\s*\d{4,5}-\d{4}/gi, '')
    .replace(/www\.[a-z0-9.-]+\.[a-z]{2,}/gi, '')
    
    // 3. Remove caracteres decorativos de tabela
    .replace(/^[-_*=]{3,}$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    const items = textContent.items as any[];
    items.sort((a, b) => {
      if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
        return b.transform[5] - a.transform[5];
      }
      return a.transform[4] - b.transform[4];
    });

    const pageText = items.map(item => item.str).join(' ');
    fullText += ` ${pageText}`;
  }

  return cleanPDFText(fullText);
}
