'use client';

import { useState } from 'react';

export default function ImportarPCAPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [resultadoJson, setResultadoJson] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPdfJs = async () => {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const converterPaginasParaImagens = async (file: File): Promise<string[]> => {
    const pdfjsLib = await carregarPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const imagensBase64: string[] = [];

    // Limita a leitura às primeiras 5 páginas principais para evitar estouro de memória
    const numPaginas = Math.min(pdf.numPages, 5);

    for (let i = 1; i <= numPaginas; i++) {
      setStatus(`Convertendo página ${i} de ${numPaginas} para imagem...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        // Extrai o base64 da imagem PNG gerada
        const base64Image = canvas.toDataURL('image/png').split(',')[1];
        imagensBase64.push(base64Image);
      }
    }

    return imagensBase64;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResultadoJson(null);
    setErro(null);

    try {
      setStatus('Carregando leitor de PDF...');
      const imagensBase64 = await converterPaginasParaImagens(file);

      setStatus('Enviando imagens das tabelas para o Gemini Vision...');
      
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imagensBase64 })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao analisar imagens do PDF.');
      }

      const jsonEstruturado = await response.json();
      setResultadoJson(jsonEstruturado);
    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Erro ao processar o PDF.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded-lg bg-white p-6 shadow border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Importação Autônoma de PCA (PDF)
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Selecione o arquivo PDF oficial do SENAI-PR. O sistema renderizará as imagens das páginas para extração visual garantida.
        </p>

        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileUpload} 
          disabled={loading}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
        />
        
        {loading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 font-medium animate-pulse text-sm">
              {status}
            </p>
          </div>
        )}

        {erro && (
          <p className="mt-4 text-red-600 font-medium text-sm">
            {erro}
          </p>
        )}

        {resultadoJson && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Resultado Extraído:</h2>

            <div className="grid grid-cols-2 gap-4 mb-4 rounded-lg bg-slate-50 p-4 border border-slate-200 text-sm">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400 block">Categoria</span>
                <span className="font-bold text-blue-700 text-base">{resultadoJson.categoria || 'Não identificada'}</span>
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400 block">Nome do Curso</span>
                <span className="font-bold text-slate-900 text-base">{resultadoJson.curso || 'Não identificado'}</span>
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400 block">Carga Horária Total</span>
                <span className="font-semibold text-slate-700">{resultadoJson.carga_horaria_total}</span>
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400 block">Total de UCs Extraídas</span>
                <span className="font-semibold text-slate-700">{resultadoJson.unidades_curriculares?.length || 0}</span>
              </div>
            </div>

            <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-[400px]">
              {JSON.stringify(resultadoJson, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
