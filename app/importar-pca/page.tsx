'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ImportacaoExcelPage() {
  const [loading, setLoading] = useState(false);
  const [resultadoJson, setResultadoJson] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErro(null);

    try {
      // Carrega dinamicamente a biblioteca de Excel via CDN (sem precisar de terminal)
      if (!(window as any).XLSX) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const XLSX = (window as any).XLSX;
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Pega a primeira aba da planilha
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Converte a tabela do Excel em formato JSON
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (rawData.length === 0) {
        throw new Error('A planilha está vazia.');
      }

      // Mapeia as colunas do Excel para a estrutura do Easy PEUC Generator
      const ucsFormatadas = rawData.map((row, index) => ({
        numero: row['Número UC'] || row['Numero'] || index + 1,
        nome: row['Nome da Unidade Curricular'] || row['Nome UC'] || row['UC'] || 'UC Sem Nome',
        capacidades: row['Capacidades'] 
          ? String(row['Capacidades']).split('\n').filter(Boolean) 
          : [],
        conhecimentos: row['Conhecimentos'] 
          ? String(row['Conhecimentos']).split('\n').filter(Boolean) 
          : []
      }));

      const estruturaFinal = {
        curso: rawData[0]?.['Curso'] || 'Curso Importado via Excel',
        carga_horaria_total: rawData[0]?.['Carga Horária Total'] || 'Não informada',
        unidades_curriculares: ucsFormatadas
      };

      setResultadoJson(estruturaFinal);
    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Erro ao processar a planilha. Verifique se o arquivo está correto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Easy PEUC Generator</h1>
            <p className="text-xs text-slate-500">Importação de Dados via Planilha Excel</p>
          </div>
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline">
            ← Voltar para a Dashboard
          </Link>
        </div>

        {/* Card de Importação */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 text-xl font-bold text-slate-800">
            Importar Planilha (.xlsx ou .csv)
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Crie uma planilha no seu computador com as colunas: <strong>Número UC</strong>, <strong>Nome da Unidade Curricular</strong>, <strong>Capacidades</strong> e <strong>Conhecimentos</strong>.
          </p>

          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileUpload} 
            disabled={loading}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer"
          />
          
          {loading && (
            <p className="mt-4 text-green-600 font-medium animate-pulse">
              Carregando leitor e processando planilha...
            </p>
          )}

          {erro && (
            <p className="mt-4 text-red-600 font-medium text-sm">
              {erro}
            </p>
          )}

          {resultadoJson && (
            <div className="mt-6">
              <h3 className="text-md font-bold text-slate-800 mb-2">Dados Processados (JSON):</h3>
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
