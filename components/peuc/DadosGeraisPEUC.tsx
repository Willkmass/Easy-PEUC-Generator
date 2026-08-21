"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PEUC, Curso, UnidadeCurricular, Usuario } from "@/types";

interface Props {
  data: Partial<PEUC>;
  onChange: (field: keyof PEUC, value: any) => void;
}

export default function DadosGeraisPEUC({ data, onChange }: Props) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [ucs, setUcs] = useState<UnidadeCurricular[]>([]);
  const [docentes, setDocentes] = useState<Usuario[]>([]);

  useEffect(() => {
    fetchCursosAndDocentes();
  }, []);

  useEffect(() => {
    if (data.cursoId) {
      fetchUcs(data.cursoId);
    } else {
      setUcs([]);
    }
  }, [data.cursoId]);

  const fetchCursosAndDocentes = async () => {
    const { data: cData } = await supabase.from("cursos").select("*");
    const { data: uData } = await supabase.from("users").select("*").eq("perfil", "docente");

    if (cData) setCursos(cData);
    if (uData) setDocentes(uData);
  };

  const fetchUcs = async (cursoId: string) => {
    const { data: ucsData } = await supabase
      .from("unidades_curriculares")
      .select("*")
      .eq("curso_id", cursoId);
    if (ucsData) setUcs(ucsData);
  };

  const handleUcSelect = (ucId: string) => {
    const uc = ucs.find((u) => u.id === ucId);
    onChange("unidadeCurricularId", ucId);
    if (uc) {
      onChange("cargaHorariaUC", uc.cargaHoraria);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow space-y-4">
      <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Dados Gerais da PEUC</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Curso</label>
          <select
            className="w-full rounded border p-3 bg-slate-50"
            value={data.cursoId || ""}
            onChange={(e) => onChange("cursoId", e.target.value)}
          >
            <option value="">-- Selecione o Curso --</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Unidade Curricular (UC)</label>
          <select
            className="w-full rounded border p-3 bg-slate-50 disabled:opacity-50"
            disabled={!data.cursoId}
            value={data.unidadeCurricularId || ""}
            onChange={(e) => handleUcSelect(e.target.value)}
          >
            <option value="">-- Selecione a UC --</option>
            {ucs.map((u) => (
              <option key={u.id} value={u.id}>{u.nome} ({u.cargaHoraria}h)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Docente Responsável</label>
          <select
            className="w-full rounded border p-3 bg-slate-50"
            value={data.docenteId || ""}
            onChange={(e) => onChange("docenteId", e.target.value)}
          >
            <option value="">-- Selecione o Docente --</option>
            {docentes.map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Carga Horária da UC</label>
          <input
            type="number"
            readOnly
            className="w-full rounded border p-3 bg-slate-100 text-slate-600 font-medium"
            value={data.cargaHorariaUC || 0}
            placeholder="0h"
          />
        </div>
      </div>
    </div>
  );
}
