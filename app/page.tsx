import { supabase } from "../lib/supabase/client";

export default async function HomePage() {
  let status = "Desconectado";

  try {
    const { error } = await supabase
      .from("cursos")
      .select("*")
      .limit(1);

    if (!error) {
      status = "Conectado ao Supabase";
    }
  } catch {
    status = "Erro de conexão";
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold">
          Easy PEUC Generator
        </h1>

        <p className="mt-4 text-lg">
          Status: {status}
        </p>
      </div>
    </main>
  );
}
