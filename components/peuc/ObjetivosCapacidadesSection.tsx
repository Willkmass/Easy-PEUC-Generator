'use client';

import { usePeucForm } from '@/app/peuc/criar/usePeucForm';

export function ObjetivosCapacidadesSection({ form }: { form: ReturnType<typeof usePeucForm> }) {
  const contarItens = (texto: string) => {
    if (!texto.trim()) return 0;
    return texto.split('\n').filter((linha) => linha.trim().length > 0).length;
  };

  const qtdTecnicas = contarItens(form.capacidadesTecnicas);
  const qtdBasicas = contarItens(form.capacidadesBasicas);
  const qtdSocio = contarItens(form.capacidadesSocioemocionais);

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-800/80">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 font-black text-xs border border-purple-500/30">
          02
        </span>
        <h2 className="text-lg font-bold text-slate-100">Objetivos e Capacidades do PCA</h2>
      </div>

      <div className="space-y-5 text-xs">
        {/* Objetivo Geral */}
        <div>
          <label className="font-semibold block mb-2 text-slate-300">Objetivo Geral da UC</label>
          <textarea
            rows={2}
            value={form.objetivoGeral}
            onChange={(e) => form.setObjetivoGeral(e.target.value)}
            placeholder="Descreva o objetivo geral da unidade curricular..."
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-600"
          />
        </div>

        {/* Competências */}
        <div>
          <label className="font-semibold block mb-2 text-slate-300">Competência(s) Relacionada(s)</label>
          <textarea
            rows={2}
            value={form.competencias}
            onChange={(e) => form.setCompetencias(e.target.value)}
            placeholder="Descreva as competências técnicas e operacionais..."
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 p-3.5 rounded-xl outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-600"
          />
        </div>

        {/* Grid de Capacidades */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          
          {/* Capacidades Técnicas */}
          <div className="bg-slate-950/60 border border-indigo-500/20 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                Capacidades Técnicas
              </span>
              <span className="bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-500/20">
                {qtdTecnicas} {qtdTecnicas === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {/* Dropdown de Seleção (Nativo e Fechado) */}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  form.adicionarCapacidadeAoCampo(e.target.value, 'tecnica');
                }
              }}
              className="w-full bg-slate-900 border border-indigo-500/30 text-indigo-200 px-3 py-2 rounded-lg text-xs outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="" disabled>
                + Adicionar capacidade do PCA...
              </option>
              {form.capacidadesDisponiveis.map((cap, index) => (
                <option key={index} value={cap} className="bg-slate-900 text-slate-200">
                  {cap}
                </option>
              ))}
            </select>

            {/* Campo Livre de Escrita */}
            <textarea
              rows={7}
              value={form.capacidadesTecnicas}
              onChange={(e) => form.setCapacidadesTecnicas(e.target.value)}
              placeholder="Digite livremente ou selecione no menu acima..."
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 p-3 rounded-lg text-xs outline-none focus:border-indigo-500/50 transition-colors leading-relaxed placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Capacidades Básicas */}
          <div className="bg-slate-950/60 border border-purple-500/20 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                Capacidades Básicas
              </span>
              <span className="bg-purple-500/10 text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-purple-500/20">
                {qtdBasicas} {qtdBasicas === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {/* Dropdown de Seleção (Nativo e Fechado) */}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  form.adicionarCapacidadeAoCampo(e.target.value, 'basica');
                }
              }}
              className="w-full bg-slate-900 border border-purple-500/30 text-purple-200 px-3 py-2 rounded-lg text-xs outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="" disabled>
                + Adicionar capacidade do PCA...
              </option>
              {form.capacidadesDisponiveis.map((cap, index) => (
                <option key={index} value={cap} className="bg-slate-900 text-slate-200">
                  {cap}
                </option>
              ))}
            </select>

            {/* Campo Livre de Escrita */}
            <textarea
              rows={7}
              value={form.capacidadesBasicas}
              onChange={(e) => form.setCapacidadesBasicas(e.target.value)}
              placeholder="Digite livremente ou selecione no menu acima..."
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 p-3 rounded-lg text-xs outline-none focus:border-purple-500/50 transition-colors leading-relaxed placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Capacidades Socioemocionais */}
          <div className="bg-slate-950/60 border border-emerald-500/20 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Capacidades Socioemocionais
              </span>
              <span className="bg-emerald-500/10 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                {qtdSocio} {qtdSocio === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <textarea
              rows={9}
              value={form.capacidadesSocioemocionais}
              onChange={(e) => form.setCapacidadesSocioemocionais(e.target.value)}
              placeholder="Geradas via IA ou digitadas livremente..."
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 p-3 rounded-lg text-xs outline-none focus:border-emerald-500/50 transition-colors leading-relaxed placeholder:text-slate-600 resize-none"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
