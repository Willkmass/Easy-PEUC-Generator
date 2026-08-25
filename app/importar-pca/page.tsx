'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ImportarPCAPage() {
  const [loading, setLoading] = useState(false);
  const [resultadoJson, setResultadoJson] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResultadoJson(null);
    setErro(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Falha no processamento do arquivo.');
      }

      const jsonEstruturado = await response.json();
      setResultadoJson(jsonEstruturado);
    } catch (err: any) {
      console.error(err);
      setErro('Erro ao processar o PDF. Verifique se o arquivo está correto.');
    } finally {
      setLoading(false);
    }
  };

  // Função autônoma que converte o JSON extraído em um arquivo CSV/Excel para download
  const baixarComoExcel = () => {
    if (!resultadoJson || !resultadoJson.unidades_curriculares) return;

    let csvContent = '\uFEFF'; // BOM para garantir acentuação correta no Excel
    csvContent += 'Número UC;Nome da Unidade Curricular;Carga Horária;Capacidades;Conhecimentos\n';

    resultadoJson.unidades_curriculares.forEach((uc: any) => {
      const num = uc.numero || '';
      const nome = `"${(uc.nome || '').replace(/"/g, '""')}"`;
      const ch = uc.carga_horaria || '';
      const cap = `"${(uc.capacidades || []).join(' | ').replace(/"/g, '""')}"`;
      const con = `"${(uc.conhecimentos || []).join(' | ').replace(/"/g, '""')}"`;

      csvContent += `${num};${nome};${ch};${cap};${con}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PCA_${(resultadoJson.curso || 'Extraido').replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Easy PEUC Generator</h1>
            <p className="text-xs text-slate-500">Conversão Autônoma: PDF → IA → Excel / JSON</p>
          </div>
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline">
            ← Voltar para a Dashboard
          </Link>
        </div>

        {/* Card Principal */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 text-xl font-bold text-slate-800">
            Importar PDF do PCA
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Envie o PDF original. O sistema fará a interpretação completa das tabelas e gerará a planilha pronta automaticamente.
          </p>

          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileUpload} 
            disabled={loading}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
          
          {loading && (
            <p className="mt-4 text-blue-600 font-medium animate-pulse">
              Interpretando PDF visualmente com Inteligência Artificial...
            </p>
          )}

          {erro && (
            <p className="mt-4 text-red-600 font-medium text-sm">
              {erro}
            </p>
          )}

          {resultadoJson && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-bold text-slate-800">Dados Extraídos com Sucesso:</h3>
                
                {/* Botão de Download da Planilha Gerada */}
                <button
                  onClick={baixarComoExcel}
                  className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 transition"
                >
                  Baixar Planilha Excel (.csv)
                </button>
              </div>

              <div className="mb-4 rounded bg-slate-50 p-3 border border-slate-200 text-sm">
                <p><strong>Curso:</strong> {resultadoJson.curso}</p>
                <p><strong>Carga Horária Total:</strong> {resultadoJson.carga_horaria_total}</p>
                <p><strong>Total de UCs Extraídas:</strong> {resultadoJson.unidades_curriculares?.length || 0}</p>
              </div>

              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-[400px]">
                {JSON.stringify(resultadoJson, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
