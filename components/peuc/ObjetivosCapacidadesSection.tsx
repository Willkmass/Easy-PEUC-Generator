'use client';

import { usePeucForm } from '@/app/peuc/criar/usePeucForm';

export function ObjetivosCapacidadesSection({ form }: { form: ReturnType<typeof usePeucForm> }) {
  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-800/80">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 font-black text-xs border border-purple-500/30">
          02
        </span>
        <h2 className="text-lg font-bold text-slate-100">Objetivos e Capacidades do PCA</h2>
      </div>

      <div className="space-y-5 text-xs">
        <div>
          <label className="font-semibold block mb-2 text-slate-300">Objetivo Geral da UC</label>
          <textarea
            rows={2}
            value={form.objetivoGeral}
            onChange={(e) => form.setObjetivoGeral(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl outline-none"
          />
        </div>

        <div>
          <label className="font-semibold block mb-2 text-slate-300">Competência(s) Relacionada(s)</label>
          <textarea
            rows={2}
            value={form.competencias}
            onChange={(e) => form.setCompetencias(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="bg-slate-950/60 border border-indigo-500/20 p-4 rounded-xl space-y-3">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">Capacidades Técnicas</span>
            <textarea
              rows={6}
              value={form.capacidadesTecnicas}
              onChange={(e) => form.setCapacidadesTecnicas(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 p-3 rounded-lg text-xs outline-none"
            />
          </div>

          <div className="bg-slate-950/60 border border-purple-500/20 p-4 rounded-xl space-y-3">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">Capacidades Básicas</span>
            <textarea
              rows={6}
              value={form.capacidadesBasicas}
              onChange={(e) => form.setCapacidadesBasicas(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 p-3 rounded-lg text-xs outline-none"
            />
          </div>

          <div className="bg-slate-950/60 border border-emerald-500/20 p-4 rounded-xl space-y-3">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Capacidades Socioemocionais</span>
            <textarea
              rows={6}
              value={form.capacidadesSocioemocionais}
              onChange={(e) => form.setCapacidadesSocioemocionais(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 p-3 rounded-lg text-xs outline-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
