'use client';

import { usePeucForm } from '@/app/peuc/criar/usePeucForm';

export function PlanoAulaSection({ form }: { form: ReturnType<typeof usePeucForm> }) {
  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
      <div className="flex justify-between items-center pb-5 mb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 font-black text-xs border border-emerald-500/30">
            04
          </span>
          <h2 className="text-lg font-bold text-slate-100">Matriz do Plano de Aula</h2>
        </div>
        <button
          type="button"
          onClick={form.adicionarLinhaAula}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition active:scale-95 shadow-md"
        >
          + Adicionar Aula
        </button>
      </div>

      <div className="space-y-4">
        {form.planosAula.map((item, idx) => (
          <div key={idx} className="border border-slate-800/80 p-4 rounded-xl bg-slate-950/60 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[11px]">
                Aula #{idx + 1}
              </span>
              {form.planosAula.length > 1 && (
                <button
                  type="button"
                  onClick={() => form.removerLinhaAula(idx)}
                  className="text-rose-400 hover:text-rose-300 font-semibold text-xs"
                >
                  Remover
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <textarea
                placeholder="Conhecimentos..."
                value={item.conhecimentos}
                onChange={(e) => form.atualizarLinhaAula(idx, 'conhecimentos', e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 outline-none text-slate-200"
              />
              <textarea
                placeholder="Estratégias..."
                value={item.estrategias}
                onChange={(e) => form.atualizarLinhaAula(idx, 'estrategias', e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 outline-none text-slate-200"
              />
              <textarea
                placeholder="Recursos / Instrumentos..."
                value={item.recursos}
                onChange={(e) => form.atualizarLinhaAula(idx, 'recursos', e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 outline-none text-slate-200"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
