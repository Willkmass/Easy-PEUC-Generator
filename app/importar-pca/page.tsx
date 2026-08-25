'use client';

import { useState } from 'react';

export default function ImportarPCAPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [sucesso, setSucesso] = useState<any>(null);
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

    const numPaginas = Math.min(pdf.numPages, 5);

    for (let i = 1; i <= numPaginas; i++) {
      setStatus(`Convertendo página ${i} de ${numPaginas} em imagem...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        imagensBase64.push(canvas.toDataURL('image/png').split(',')[1]);
      }
    }

    return imagensBase64;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setSucesso(null);
    setErro(null);

    try {
      setStatus('Carregando leitor visual...');
      const imagensBase64 = await converterPaginasParaImagens(file);

      setStatus('Extraindo dados via IA e salvando no Supabase...');
      
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imagensBase64 })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Erro na importação.');

      setSucesso(resData);
    } catch (err: any) {
      setErro(err.message || 'Falha ao importar PCA.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Alimentar Banco de Dados (PCA em PDF)</h1>
        <p className="text-sm text-slate-500 mb-6">
          Selecione o arquivo do Plano de Curso. O sistema extrai a Categoria, o Curso e as UCs e salva no Supabase.
        </p>

        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileUpload} 
          disabled={loading}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
        />
        
        {loading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-blue-700 font-medium animate-pulse text-sm">{status}</p>
          </div>
        )}

        {erro && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-600 text-sm font-medium">{erro}</p>
          </div>
        )}

        {sucesso && (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 border border-slate-200">
            <span className="inline-block rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 mb-2">
              ✓ Cadastrado com Sucesso no Supabase
            </span>
            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400 block">Categoria</span>
                <span className="font-bold text-blue-700">{sucesso.dadosExtraidos.categoria}</span>
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400 block">Nome do Curso</span>
                <span className="font-bold text-slate-900">{sucesso.dadosExtraidos.curso}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
