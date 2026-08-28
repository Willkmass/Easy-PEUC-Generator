'use client';

import { usePeucForm } from './usePeucForm';
import { IdentificacaoGeralSection } from '@/components/peuc/IdentificacaoGeralSection';
import { ObjetivosCapacidadesSection } from '@/components/peuc/ObjetivosCapacidadesSection';
import { SituacaoAprendizagemSection } from '@/components/peuc/SituacaoAprendizagemSection';
import { PlanoAulaSection } from '@/components/peuc/PlanoAulaSection';
import { GeminiChatModal } from '@/components/peuc/GeminiChatModal';

export default function CriarPEUCPage() {
  const form = usePeucForm();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-purple-500 selection:text-white font-sans relative">
      <header className="relative overflow-hidden bg-slate-900 border-b border-indigo-500/10 py-8 px-6 shadow-xl mb-10">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 text-[11px] font-bold px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider">
                Easy PEUC Generator
              </span>
              <span className="bg-slate-800 text-slate-400 text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-700/50">
                Metodologia SENAI
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Criar Plano de Ensino por Unidade Curricular
            </h1>
          </div>
          <button
            type="button"
            onClick={() => form.router.push('/peuc')}
            className="text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 px-4 py-2.5 rounded-xl transition duration-200 backdrop-blur-sm"
          >
            ← Voltar ao Painel
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6">
        <form onSubmit={form.salvarPEUC} className="space-y-8">
          <IdentificacaoGeralSection form={form} />
          <ObjetivosCapacidadesSection form={form} />
          <SituacaoAprendizagemSection form={form} />
          <PlanoAulaSection form={form} />

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition active:scale-95 text-xs"
            >
              Salvar Plano de Ensino
            </button>
          </div>
        </form>
      </div>

      <GeminiChatModal form={form} />
    </main>
  );
}
