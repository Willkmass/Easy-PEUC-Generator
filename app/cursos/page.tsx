"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";

interface Curso {
  id: string;
  nome: string;
  modalidade: string;
}

export default function CursosPage() {
  const [nome, setNome] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [cursos, setCursos] = useState<Curso[]>([]);

  async function carregarCursos() {
    const { data } = await supabase
      .from("cursos")
      .select("*")
      .order("nome");

    setCursos(data || []);
  }

  async function salvarCurso() {
    if (!nome) return;

    await supabase.from("cursos").insert({
      nome,
      modalidade,
    });

    setNome("");
    setModalidade("");

    carregarCursos();
  }

  useEffect(() => {
    carregarCursos();
  }, []);

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-bold">
        Cursos
      </h1>

      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="rounded border p-3"
            placeholder="Nome do Curso"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            className="rounded border p-3"
            placeholder="Modalidade"
            value={modalidade}
            onChange={(e) => setModalidade(e.target.value)}
          />
        </div>

        <button
          onClick={salvarCurso}
          className="mt-4 rounded bg-blue-600 px-6 py-3 text-white"
        >
          Salvar Curso
        </button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">
          Cursos Cadastrados
        </h2>

        {cursos.map((curso) => (
          <div
            key={curso.id}
            className="border-b py-2"
          >
            <strong>{curso.nome}</strong>
            <br />
            {curso.modalidade}
          </div>
        ))}
      </div>
    </main>
  );
}
