export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="bg-blue-900 px-10 py-12 text-white">
        <h1 className="text-5xl font-bold">
          Easy PEUC Generator
        </h1>

        <p className="mt-4 text-xl">
          Plataforma Inteligente para Planejamento de Ensino do SENAI-PR
        </p>
      </div>

      <div className="mx-auto max-w-7xl p-8">
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <a
                className="rounded-lg bg-white p-6 shadow transition hover:bg-slate-50"
          >
            <h2 className="text-xl font-bold">
              Cursos
            </h2>

            <p className="mt-2 text-slate-600">
              Gerenciar cursos cadastrados.
            </p>
          </a>

          "
            className="rounded-lg bg-white p-6 shadow transition hover:bg-slate-50"
          >
            <h2 className="text-xl font-bold">
              UCs
            </h2>

            <p className="mt-2 text-slate-600">
              Gerenciar unidades curriculares.
            </p>
          </a>

          <a
            href="/peuc/criar"
            className="rounded-lg bg-white p-6 C
            </h2>

            <p className="mt-2 text-slate-600">
              Criar um novo planejamento.
            </p>
          </a>

          importacao"
            className="rounded-lg bg-white p-6 shadow transition hover:bg-slate-50"
          >
            <h2 className="text-xl font-bold">
              Importação
            </h2>

            <p className="mt-2 text-slate-600">
              Importar dados em Excel.
            </p>
          </a>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">
            Objetivo do Sistema
          </h2>

          <p className="mt-4 text-slate-700">
            Automatizar a elaboração de PEUCs do SENAI-PR através da reutilização
            de cursos, capacidades, conhecimentos, critérios de avaliação,
            metodologias e situações de aprendizagem armazenadas em banco de dados.
          </p>

          <p className="mt-4 text-slate-700">
            O sistema foi projetado para se tornar mais inteligente à medida que
            novas PEUCs forem criadas e cadastradas.
          </p>
        </div>
      </div>
    </main>
  );
}
