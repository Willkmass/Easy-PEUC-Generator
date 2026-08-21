export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-5xl font-bold">
          Easy PEUC Generator
        </h1>

        <p className="mb-8 text-xl text-slate-600">
          Sistema Inteligente de Geração de PEUC do SENAI-PR
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <a
            href="/cursos"
            className="rounded-lg bg-white p-6 shadow hover:bg-slate-50"
                 /unidades-curriculares hover:bg-slate-50"
          >
            <h2 className="text-xl font-bold">
              Unidades Curriculares
            </h2>
          </a>

          /criar"
            className="rounded-lg bg-white p-6 shadow hover:bg-slate-50"
          >
            <h2 className="text-xl font-bold">
              Nova PEUC
            </h2>
          </a>

          <a
            href="/importacao"
rounded-lg bg-white p-6 shadow hover:bg-slate-50"
          >
            <h2 className="text-xl font-bold">
              Importação Excel
            </h2>
          </a>
        </div>
      </div>
    </main>
  );
}
