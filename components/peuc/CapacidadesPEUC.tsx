"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PEUC, Capacidade } from "@/types";

interface Props {
  data: Partial<PEUC>;
  onChange: (field: keyof PEUC, value: any) => void;
}

export default function CapacidadesPEUC({ data, onChange }: Props) {
  const [capacidades, setCapacidades] = useState<Capacidade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data.unidadeCurricularId) {
      fetchCapacidades(data.unidadeCurricularId);
    } else {
      setCapacidades([]);
    }
  }, [data.unidadeCurricularId]);

  const fetchCapacidades = async (ucId: string) => {
    setLoading(true);
    const { data: capsData } = await supabase
      .from("capacidades")
      .select("*")
      .eq("unidade_curricular_id", ucId);

    if (capsData) setCapacidades(capsData);
    setLoading(false);
  };

  const handleToggleCapacidade = (capId: string) => {
    const selected = data.capacidadesSelecionadasIds || [];
    const exists = selected.includes(capId);

    if (exists) {
      onChange(
        "capacidadesSelecionadasIds",
        selected.filter((id) => id !== capId)
      );
    } else {
      onChange("capacidadesSelecionadasIds", [...selected, capId]);
    }
  };

  const renderCapacidadesPorTipo = (tipo: "tecnica" | "basica" | "socioemocional", titulo: string) => {
    const filtradas = capacidades.filter((c) => c.tipo === tipo);

    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-slate-700 text-sm uppercase">{titulo} ({filtradas.length})</h3>
        {filtradas.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Nenhuma capacidade encontrada.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto border p-3 rounded bg-slate-50">
            {filtradas.map((cap) => {
              const checked = data.capacidadesSelecionadasIds?.includes(cap.id) || false;
              return (
                <label key={cap.id} className="flex items-start gap-2.5 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleCapacidade(cap.id)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={checked ? "font-medium text-slate-900" : "text-slate-600"}>
                    {cap.descricao}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow space-y-4">
      <h2 className="text-xl font-bold text-slate-800 border-b pb-2">
        Capacidades do PCA
      </h2>

      {!data.unidadeCurricularId ? (
        <p className="text-sm text-slate-500">Selecione uma Unidade Curricular nos Dados Gerais para carregar as capacidades.</p>
      ) : loading ? (
        <p className="text-sm text-slate-500 animate-pulse">Carregando capacidades da UC...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {renderCapacidadesPorTipo("tecnica", "Capacidades Técnicas")}
          {renderCapacidadesPorTipo("basica", "Capacidades Básicas")}
          {renderCapacidadesPorTipo("socioemocional", "Capacidades Socioemocionais")}
        </div>
      )}
    </div>
  );
}
