'use client';

import { useState } from 'react';
import Link from 'next/link';
import { extractTextFromPDF } from '@/lib/pdf-parser';

export default function ImportarPCAPage() {
  const [loading, setLoading] = useState(false);
  const [resultadoJson, setResultadoJson] = useState<any>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResultadoJson(null);

    try {
      const textoExtraido = await extractTextFromPDF(file);
      
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textoExtraido })
      });

      const jsonEstruturado = await response.json();
      setResultadoJson(jsonEstruturado);
    } catch (error) {
      console.error('Erro na operação:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline">
          ← Voltar para a Dashboard
        </Link>
        <h1 className="mt-2 mb-6 text-3xl font-bold text-slate-900">
          Importar Plano de Curso (PCA)
        </h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <label className="block mb-2 font-medium text-slate-700">
            Selecione o arquivo PDF do PCA:
          </label>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileUpload} 
            disabled={loading}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          
          {loading && (
            <p className="mt-4 text-blue-600 font-medium animate-pulse">
              Processando o PDF com Inteligência Artificial...
            </p>
          )}

          {resultadoJson && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Dados Extraídos (JSON):</h2>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-[500px]">
                {JSON.stringify(resultadoJson, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
