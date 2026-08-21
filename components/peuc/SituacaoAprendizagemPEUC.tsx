"use client";

import { PEUC, TipoSituacaoAprendizagem } from "@/types";

interface Props {
  data: Partial<PEUC>;
  onChange: (field: keyof PEUC, value: any) => void;
}

export default function SituacaoAprendizagemPEUC({ data, onChange }: Props) {
  const tiposEstrategia: TipoSituacaoAprendizagem[] = [
    "Situacao-Problema",
    "Estudo de Caso",
    "Pesquisa Aplicada",
    "Projeto",
    "Projeto Integrador",
  ];

  return (
    <div className="rounded-lg bg-white p-6 shadow space-y-4">
      <h2 className="text-xl font-bold text-slate-800 border-b pb-2">
        Situação de Aprendizagem (SA)
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
            Estratégia Pedagógica
          </label>
          <select
            className="w-full rounded border p-3 bg-slate-50"
            value={data.tipoSituacaoAprendizagem || "Situacao-Problema"}
            onChange={(e) => onChange("tipoSituacaoAprendizagem", e.target.value as TipoSituacaoAprendizagem)}
          >
            {tiposEstrategia.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={data.integraOutraUC || false}
              onChange={(e) => onChange("integraOutraUC", e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
            Integra com outra Unidade Curricular?
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
            Contextualização (Cenário / Situação Real)
          </label>
          <textarea
            className="h-28 w-full rounded border p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Descreva o contexto do mercado de trabalho ou cenário real da prática profissional..."
            value={data.contextualizacao || ""}
            onChange={(e) => onChange("contextualizacao", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
            Desafio
          </label>
          <textarea
            className="h-28 w-full rounded border p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Qual o problema, atividade ou entrega que os alunos precisarão resolver?"
            value={data.desafio || ""}
            onChange={(e) => onChange("desafio", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
            Resultados Esperados (Entregáveis)
          </label>
          <textarea
            className="h-28 w-full rounded border p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Produtos, protótipos, relatórios ou apresentações esperadas ao final da SA..."
            value={data.resultadosEsperados || ""}
            onChange={(e) => onChange("resultadosEsperados", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
