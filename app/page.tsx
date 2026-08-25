import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Cabeçalho do Dashboard */}
      <div className="mb-8 flex flex-col gap-1 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Painel de Gestão Pedagógica
        </h1>
        <p className="text-sm text-slate-500">
          Automação de extratos de PCA e montagem simplificada de PEUCs do SENAI-PR.
        </p>
      </div>

      {/* Grid de Ações Rápidas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        
        {/* Card 1: Importar PCA */}
        <Link
          href="/importar-pca"
          className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              📄
            </div>
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              Importar PCA (PDF)
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Extraia automaticamente dados de Planos de Curso via visão computacional e organize UCs, Capacidades e Conhecimentos.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-semibold text-blue-600">
            Acessar extrator <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
          </div>
        </Link>

        {/* Card 2: Nova PEUC */}
        <Link
          href="/peuc/criar"
          className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              ✏️
            </div>
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              Criar Nova PEUC
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Elabore o Plano de Ensino por Unidade Curricular integrando situações de aprendizagem e cronogramas de aula.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-semibold text-emerald-600">
            Iniciar elaboração <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
          </div>
        </Link>

        {/* Card 3: Cursos & UCs */}
        <Link
          href="/cursos"
          className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md sm:col-span-2 lg:col-span-1"
        >
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              📚
            </div>
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              Acervo de Cursos & UCs
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Consulte e gerencie a base de dados de cursos cadastrados, separando Categoria Pedagógica do Nome do Curso.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-semibold text-indigo-600">
            Ver base cadastrada <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
          </div>
        </Link>

      </div>

      {/* Painel Informativo de Status */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Status do Sistema
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-center">
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
            <span className="block text-2xl font-bold text-slate-900">IA Activa</span>
            <span className="text-xs text-slate-500">Extrator Gemini Vision 2.5</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
            <span className="block text-2xl font-bold text-slate-900">Supabase</span>
            <span className="text-xs text-slate-500">Banco de Dados Conectado</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
            <span className="block text-2xl font-bold text-slate-900">SENAI-PR</span>
            <span className="text-xs text-slate-500">Diretrizes Pedagógicas</span>
          </div>
        </div>
      </div>
    </main>
  );
}
