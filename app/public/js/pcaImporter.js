import { PDFDocument } from 'pdf-lib';

export async function dividirEEnviarPdf(fileOriginal) {
  const arrayBuffer = await fileOriginal.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const totalPaginas = pdfDoc.getPageCount();
  const meio = Math.ceil(totalPaginas / 2);

  // Criar Parte 1 (Página 1 até a metade)
  const pdfParte1 = await PDFDocument.create();
  const paginas1 = await pdfParte1.copyPages(pdfDoc, Array.from({ length: meio }, (_, i) => i));
  paginas1.forEach(p => pdfParte1.addPage(p));
  const blob1 = new Blob([await pdfParte1.save()], { type: 'application/pdf' });

  // Criar Parte 2 (Da metade até o final)
  const pdfParte2 = await PDFDocument.create();
  const paginas2 = await pdfParte2.copyPages(pdfDoc, Array.from({ length: totalPaginas - meio }, (_, i) => i + meio));
  paginas2.forEach(p => pdfParte2.addPage(p));
  const blob2 = new Blob([await pdfParte2.save()], { type: 'application/pdf' });

  // Monta FormData com as duas partes
  const formData = new FormData();
  formData.append('arquivos', blob1, 'parte1.pdf');
  formData.append('arquivos', blob2, 'parte2.pdf');

  // Envia para o backend
  const res = await fetch('/api/ingestao-pdf', {
    method: 'POST',
    body: formData
  });

  return await res.json();
}

// Exemplo de chamada ao submeter o formulário na tela:
document.getElementById('formImportarPca')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const inputPdf = document.getElementById('inputPdf');
  
  if (inputPdf.files.length > 0) {
    console.log("Fatiando e enviando PDF...");
    const resultado = await dividirEEnviarPdf(inputPdf.files[0]);
    console.log("Resultado retornado do backend:", resultado);
  }
});
