'use client';

import { usePeucForm } from '@/app/peuc/criar/usePeucForm';

export function IdentificacaoGeralSection({ form }: { form: ReturnType<typeof usePeucForm> }) {
  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-5 mb-6 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs border border-indigo-500/30">
            01
          </span>
          <h2 className="text-lg font-bold text-slate-100">Identificação Geral</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
        <div className="md:col-span-1">
          <label className="font-semibold block mb-2 text-indigo-300">Selecionar Curso (PCA)</label>
          <select
            value={form.cursoSelecionado}
            onChange={(e) => form.aoMudarCurso(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl outline-none"
            required
          >
            {form.carregando ? (
              <option value="">Carregando matrizes...</option>
            ) : form.listaCursos.length === 0 ? (
              <option value="">Nenhum curso carregado</option>
            ) : (
              form.listaCursos.map((c, i) => (
                <option key={i} value={c.nome}>
                  {c.nome}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="font-semibold block mb-2 text-slate-400">Modalidade</label>
          <input
            type="text"
            value={form.modalidade}
            onChange={(e) => form.setModalidade(e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800 text-slate-300 p-3 rounded-xl outline-none"
          />
        </div>

        <div>
          <label className="font-semibold block mb-2 text-slate-400">Módulo</label>
          <input
            type="text"
            value={form.modulo}
            onChange={(e) => form.setModulo(e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800 text-slate-300 p-3 rounded-xl outline-none"
          />
        </div>

        <div>
          <label className="font-semibold block mb-2 text-indigo-300">Unidade Curricular (UC)</label>
          <select
            value={form.ucSelecionada}
            onChange={(e) => form.aoMudarUC(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl outline-none"
            required
          >
            {form.ucsDisponiveis.map((u, i) => {
              const nomeUC = u.nomeUc || u.nome_uc || u.nome || u.unidade || u.titulo || `UC #${i + 1}`;
              return (
                <option key={i} value={nomeUC}>
                  {nomeUC}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="font-semibold block mb-2 text-slate-400">Carga Horária Total</label>
          <input
            type="text"
            value={form.ucCargaHoraria}
            onChange={(e) => form.setUcCargaHoraria(e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800 text-slate-300 p-3 rounded-xl outline-none"
          />
        </div>

        <div>
          <label className="font-semibold block mb-2 text-indigo-300">Docente Responsável</label>
          <input
            type="text"
            value={form.docente}
            onChange={(e) => form.setDocente(e.target.value)}
            placeholder="Nome do docente..."
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl outline-none"
            required
          />
        </div>
      </div>
    </section>
  );
}
