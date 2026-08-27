'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function VisualizarPEUCPage() {
  const params = useParams();
  const router = useRouter();
  const [peuc, setPeuc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarPEUC() {
      const peucId = params.id as string;
      let encontrada: any = null;

      // 1. Busca no localStorage
      try {
        const locais = JSON.parse(localStorage.getItem('peucs_salvas') || '[]');
        encontrada = locais.find((p: any) => String(p.id) === String(peucId));
      } catch (err) {
        console.error('Erro ao ler localStorage:', err);
      }

      // 2. Se não achar no localStorage, busca no Supabase
      if (!encontrada) {
        try {
          const { data } = await supabase.from('peucs').select('*').eq('id', peucId).single();
          if (data) encontrada = data;
        } catch (err) {
          console.warn('Erro ao buscar no Supabase:', err);
        }
      }

      setPeuc(encontrada);
      setLoading(false);
    }

    carregarPEUC();
  }, [params.id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando visualização...</div>;
  }

  if (!peuc) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-600 font-semibold">PEUC não encontrada.</p>
        <button onClick={() => router.push('/peuc')} className="text-xs bg-slate-200 px-3 py-1.5 rounded">
          Voltar para a lista
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 print:p-0 print:bg-white">
      {/* Botões de Ação (Escondidos na Impressão) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => router.push('/peuc')}
          className="text-xs font-semibold bg-white border border-slate-300 px-4 py-2 rounded-md hover:bg-slate-50"
        >
          ← Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="text-xs font-semibold bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 shadow-sm"
        >
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Folha Oficial de Impressão (Estilo Documento SENAI) */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 p-8 shadow-md print:shadow-none print:border-none print:p-0 text-slate-900 text-xs">
        
        {/* Cabeçalho Institucional */}
        <div className="border border-slate-900 p-4 text-center mb-4">
          <h1 className="font-bold text-sm uppercase">SISTEMA SENAI-PR</h1>
          <h2 className="font-bold text-xs uppercase text-slate-700">PLANO DE ENSINO DA UNIDADE CURRICULAR (PEUC)</h2>
        </div>

        {/* 1. Identificação */}
        <div className="border border-slate-900 mb-4">
          <div className="bg-slate-200 font-bold p-1.5 border-b border-slate-900 uppercase">
            1. Identificação Geral
          </div>
          <div className="grid grid-cols-2 border-b border-slate-900">
            <div className="p-1.5 border-r border-slate-900"><strong>Curso:</strong> {peuc.curso_nome}</div>
            <div className="p-1.5"><strong>Modalidade:</strong> {peuc.modalidade}</div>
          </div>
          <div className="grid grid-cols-2 border-b border-slate-900">
            <div className="p-1.5 border-r border-slate-900"><strong>Unidade Curricular:</strong> {peuc.uc_nome}</div>
            <div className="p-1.5"><strong>Carga Horária:</strong> {peuc.uc_carga_horaria}</div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-900">
            <div className="p-1.5 border-r border-slate-900"><strong>Docente:</strong> {peuc.docente}</div>
            <div className="p-1.5 border-r border-slate-900"><strong>Módulo:</strong> {peuc.modulo || 'N/A'}</div>
            <div className="p-1.5"><strong>Nº Aulas / SA:</strong> {peuc.num_aulas} aulas / SA {peuc.num_sa}</div>
          </div>
        </div>

        {/* 2. Estratégia de Aprendizagem */}
        <div className="border border-slate-900 mb-4">
          <div className="bg-slate-200 font-bold p-1.5 border-b border-slate-900 uppercase">
            2. Estratégia de Aprendizagem Desafiadora
          </div>
          <div className="p-1.5 border-b border-slate-900">
            <strong>Estratégia:</strong> {peuc.tipo_situacao} {peuc.integra_outra_uc === 'Sim' ? `(Integrada com: ${peuc.outra_uc_nome})` : ''}
          </div>
          <div className="p-1.5 border-b border-slate-900">
            <strong>Contextualização:</strong>
            <p className="mt-1 text-slate-800 whitespace-pre-line">{peuc.contextualizacao}</p>
          </div>
          <div className="p-1.5 border-b border-slate-900">
            <strong>Desafio:</strong>
            <p className="mt-1 text-slate-800 whitespace-pre-line">{peuc.desafio}</p>
          </div>
          <div className="p-1.5">
            <strong>Resultados Esperados:</strong>
            <p className="mt-1 text-slate-800 whitespace-pre-line">{peuc.resultados_esperados}</p>
          </div>
        </div>

        {/* 3. Tabela do Plano de Aula */}
        <div className="border border-slate-900">
          <div className="bg-slate-200 font-bold p-1.5 border-b border-slate-900 uppercase">
            3. Plano de Aula
          </div>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-100 font-bold text-[10px] uppercase">
                <th className="border-r border-slate-900 p-1">Aulas</th>
                <th className="border-r border-slate-900 p-1">Capacidades</th>
                <th className="border-r border-slate-900 p-1">Conhecimentos</th>
                <th className="border-r border-slate-900 p-1">Estratégias</th>
                <th className="border-r border-slate-900 p-1">Recursos</th>
                <th className="border-r border-slate-900 p-1">Critérios</th>
                <th className="p-1">Instrumentos</th>
              </tr>
            </thead>
            <tbody>
              {peuc.planos_aula?.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-900 text-[10px]">
                  <td className="border-r border-slate-900 p-1">{item.numAulas}</td>
                  <td className="border-r border-slate-900 p-1">{item.capacidades}</td>
                  <td className="border-r border-slate-900 p-1">{item.conhecimentos}</td>
                  <td className="border-r border-slate-900 p-1">{item.estrategias}</td>
                  <td className="border-r border-slate-900 p-1">{item.recursos}</td>
                  <td className="border-r border-slate-900 p-1">{item.criterios}</td>
                  <td className="p-1">{item.instrumentos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
