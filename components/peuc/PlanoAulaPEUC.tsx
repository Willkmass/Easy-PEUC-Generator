"use client";

import { PEUC } from "@/types";

interface ComponentProps {
  data: Partial<PEUC>;
  onChange: (field: keyof PEUC, value: any) => void;
}

export default function PlanoAulaPEUC({ data, onChange }: ComponentProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold border-b pb-2">Plano de Aulas / Cronograma</h2>
      <p className="text-sm text-slate-500">
        Detalhamento da distribuição da carga horária e estratégias pedagógicas.
      </p>

      {/* Conteúdo do componente */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Observações / Estratégias de Aula
        </label>
        <textarea
          rows={4}
          className="w-full border rounded-md p-2 text-sm"
          placeholder="Descreva a metodologia de aplicação das aulas..."
          value={data.observacoes || ""}
          onChange={(e) => onChange("observacoes", e.target.value)}
        />
      </div>
    </div>
  );
}
