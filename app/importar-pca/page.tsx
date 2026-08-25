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
        {/* Cabeçalho da Marca */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Easy PEUC Generator</h1>
            <p className="text-xs text-slate-500">Módulo de Extração de PCA via IA</p>
          </div>
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline">
            ← Voltar para a Dashboard
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-slate-800">
            Importar Plano de Curso (PCA)
          </h2>
          <label className="block mb-2 text-sm font-medium text-slate-700">
            Selecione o arquivo PDF oficial do PCA:
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
              <h3 className="text-md font-bold text-slate-800 mb-2">Dados Extraídos (JSON):</h3>
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
