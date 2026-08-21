"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";

interface Curso {
  id: string;
  nome: string;
  modalidade: string;
}

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [nome, setNome] = useState("");
  const [modalidade, setModalidade] = useState("");

  async function carregarCursos() {
    const { data } = await supabase
      .from("cursos")
      .select("*")
      .order("nome");

    if (data) {
      setCursos(data);
    }
  }

  async function salvarCurso() {
    if (!nome) return;

    await supabase.from("cursos").insert({
      nome,
      modalidade
    });

    setNome("");
    setModalidade("");

    await carregarCursos();
  }

  useEffect(() => {
    carregarCursos();
  }, []);

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-bold">
        Cadastro de Cursos
      </h1>

      <div className="mb-6 rounded bg-white p-6 shadow">
        <div className="grid gap-4">
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

          <button
            onClick={salvarCurso}
            className="rounded bg-blue-600 p-3 text-white"
          >
            Salvar Curso
          </button>
        </div>
      </div>

      <div className="rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">
          Cursos Cadastrados
        </h2>

        {cursos.map((curso) => (
          <div
            key={curso.id}
            className="border-b py-3"
          >
            <strong>{curso.nome}</strong>

            <div>
              {curso.modalidade}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
