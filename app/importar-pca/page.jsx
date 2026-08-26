'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function ImportarPcaPage() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const inputElement = e.target.elements.pdfInput;

    if (!inputElement.files || inputElement.files.length === 0) {
      alert('Por favor, selecione um arquivo PDF.');
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const fileOriginal = inputElement.files[0];
      const arrayBuffer = await fileOriginal.arrayBuffer();
      
      // 1. Carrega e calcula a metade do PDF no navegador
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPaginas = pdfDoc.getPageCount();
      const meio = Math.ceil(totalPaginas / 2);

      // 2. Cria a Parte 1 (Página 1 até a metade)
      const pdfParte1 = await PDFDocument.create();
      const paginas1 = await pdfParte1.copyPages(pdfDoc, Array.from({ length: meio }, (_, i) => i));
      paginas1.forEach(p => pdfParte1.addPage(p));
      const blob1 = new Blob([await pdfParte1.save()], { type: 'application/pdf' });

      // 3. Cria a Parte 2 (Da metade até o final)
      const pdfParte2 = await PDFDocument.create();
      const paginas2 = await pdfParte2.copyPages(pdfDoc, Array.from({ length: totalPaginas - meio }, (_, i) => i + meio));
      paginas2.forEach(p => pdfParte2.addPage(p));
      const blob2 = new Blob([await pdfParte2.save()], { type: 'application/pdf' });

      // 4. Prepara o envio com os dois arquivos
      const formData = new FormData();
      formData.append('arquivos', blob1, 'parte1.pdf');
      formData.append('arquivos', blob2, 'parte2.pdf');

      // 5. Envia para a Route Handler do Next.js
      const response = await fetch('/api/ingestao-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResultado(data.data);
      } else {
        alert(`Erro no processamento: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao processar e dividir o arquivo PDF.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Importar Plano de Curso (PCA)</h1>
      
      <form onSubmit={handleSubmit} style={{ marginY: '2rem' }}>
        <input 
          type="file" 
          name="pdfInput" 
          accept="application/pdf" 
          disabled={loading} 
        />
        <button type="submit" disabled={loading} style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>
          {loading ? 'Processando e Fatiando PDF...' : 'Importar PCA'}
        </button>
      </form>

      {resultado && (
        <div style={{ marginTop: '2rem', background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
          <h2>Curso: {resultado.nomeCurso}</h2>
          <h3>Unidades Curriculares ({resultado.unidadesCurriculares?.length || 0}):</h3>
          <ul>
            {resultado.unidadesCurriculares?.map((uc, index) => (
              <li key={index} style={{ marginBottom: '1rem' }}>
                <strong>{uc.nomeUc}</strong> ({uc.cargaHoraria})
                <p>Capacidades: {uc.capacidades?.length || 0} mapeadas</p>
                <p>Conhecimentos: {uc.conhecimentos?.length || 0} mapeados</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
