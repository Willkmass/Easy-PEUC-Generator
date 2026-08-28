'use client';

import { usePeucForm } from '@/app/peuc/criar/usePeucForm';

export function SituacaoAprendizagemSection({ form }: { form: ReturnType<typeof usePeucForm> }) {
  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm text-xs">
      <div className="flex justify-between items-center pb-5 mb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-600/20 text-pink-400 font-black text-xs border border-pink-500/30">
            03
          </span>
          <h2 className="text-lg font-bold text-slate-100">Situação de Aprendizagem (SA)</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            form.setChatAberto(true);
            form.enviarMensagemGemini(`Gere uma ${form.tipoSituacao} para a UC ${form.ucSelecionada} baseada nas capacidades informadas.`);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition active:scale-95 text-xs"
        >
          <span>✨</span>
          <span>Abrir Chat Gemini</span>
        </button>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="font-semibold block mb-2 text-pink-300">Tipo de Situação</label>
            <select
              value={form.tipoSituacao}
              onChange={(e) => form.setTipoSituacao(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl outline-none"
            >
              <option value="Situação-Problema">Situação-Problema</option>
              <option value="Estudo de Caso">Estudo de Caso</option>
              <option value="Projeto">Projeto</option>
              <option value="Pesquisa Aplicada">Pesquisa Aplicada</option>
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-2 text-slate-300">Nº de Aulas da SA</label>
            <input
              type="text"
              value={form.numAulas}
              onChange={(e) => form.setNumAulas(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="font-semibold block mb-2 text-slate-300">Identificação da SA</label>
            <input
              type="text"
              value={form.numSa}
              onChange={(e) => form.setNumSa(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3 rounded-xl outline-none"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold block mb-2 text-slate-300">Contextualização do Tema</label>
          <textarea
            rows={3}
            value={form.contextualizacao}
            onChange={(e) => form.setContextualizacao(e.target.value)}
            placeholder="Cole ou digite aqui..."
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl outline-none resize-y"
          />
        </div>

        <div>
          <label className="font-semibold block mb-2 text-slate-300">Desafio Proposto</label>
          <textarea
            rows={3}
            value={form.desafio}
            onChange={(e) => form.setDesafio(e.target.value)}
            placeholder="Desafio da SA..."
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl outline-none resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="font-semibold block mb-2 text-slate-300">Resultados Esperados</label>
            <textarea
              rows={3}
              value={form.resultadosEsperados}
              onChange={(e) => form.setResultadosEsperados(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl outline-none resize-y"
            />
          </div>

          <div>
            <label className="font-semibold block mb-2 text-slate-300">Critérios Mínimos de Qualidade</label>
            <textarea
              rows={3}
              value={form.criteriosQualidade}
              onChange={(e) => form.setCriteriosQualidade(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl outline-none resize-y"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
