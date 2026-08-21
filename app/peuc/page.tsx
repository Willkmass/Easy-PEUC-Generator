"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface PeucListItem {
  id: string;
  status: string;
  created_at: string;
  cursos: { nome: string };
  unidades_curriculares: { nome: string; codigo: string };
  users: { nome: string };
}

export default function PeucsPage() {
  const [peucs, setPeucs] = useState<PeucListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeucs();
  }, []);

  const fetchPeucs = async () => {
    try {
      const { data, error } = await supabase
        .from("peucs")
        .select(`
          id,
          status,
          created_at,
          cursos (nome),
          unidades_curriculares (nome, codigo),
          users (nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPeucs((data as unknown as PeucListItem[]) || []);
    } catch (err: any) {
      console.error("Erro ao buscar PEUCs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">PEUCs Cadastradas</h1>
          <p className="mt-1 text-slate-600">
            Gerenciamento dos Planos de Ensino de Unidade Curricular.
          </p>
        </div>
        <Link
          href="/peuc/criar"
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow hover:bg-blue-700 transition"
        >
          + Nova PEUC
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Carregando planos de ensino...</div>
      ) : peucs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-8 text-center text-slate-500 bg-slate-50">
          Nenhuma PEUC cadastrada até o momento.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
              <tr>
                <th className="p-4">Curso</th>
                <th className="p-4">Unidade Curricular</th>
                <th className="p-4">Docente</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {peucs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium">{item.cursos?.nome || "N/A"}</td>
                  <td className="p-4">
                    {item.unidades_curriculares?.nome}{" "}
                    <span className="text-xs text-slate-400">({item.unidades_curriculares?.codigo})</span>
                  </td>
                  <td className="p-4">{item.users?.nome || "N/A"}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === "aprovado"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "em_revisao"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/peuc/${item.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Visualizar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
