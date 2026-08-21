import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-5xl font-bold text-slate-900">
          Easy PEUC Generator
        </h1>

        <p className="mb-8 text-xl text-slate-600">
          Sistema Inteligente de Geração de PEUC do SENAI-PR
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/cursos"
            className="rounded-lg bg-white p-6 shadow transition hover:bg-slate-50"
          >
            <h2 className="text-xl font-bold text-slate-800">Cursos</h2>
            <p className="mt-2 text-sm text-slate-500">
              Gerencie a lista de cursos institucionais
            </p>
          </Link>

          <Link
            href="/unidades-curriculares"
            className="rounded-lg bg-white p-6 shadow transition hover:bg-slate-50"
          >
            <h2 className="text-xl font-bold text-slate-800">
              Unidades Curriculares
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Cadastre e vincule UCs aos cursos
            </p>
          </Link>

          <Link
            href="/peuc/criar"
            className="rounded-lg bg-white p-6 shadow transition hover:bg-slate-50"
          >
            <h2 className="text-xl font-bold text-slate-800">
              Nova PEUC
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Gere um novo plano de ensino
            </p>
          </Link>

          <Link
            href="/importacao"
            className="rounded-lg bg-white p-6 shadow transition hover:bg-slate-50"
          >
            <h2 className="text-xl font-bold text-slate-800">
              Importação Excel
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Importe dados em lote via planilha
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
