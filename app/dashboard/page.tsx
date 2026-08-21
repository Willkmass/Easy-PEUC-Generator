export default function DashboardPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">
        Dashboard Easy PEUC
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-sm text-slate-500">
            Cursos
          </h2>

          <p className="mt-2 text-3xl font-bold">
            0
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-sm text-slate-500">
            UCs
          </h2>

          <p className="mt-2 text-3xl font-bold">
            0
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-sm text-slate-500">
            PEUCs
          </h2>

          <p className="mt-2 text-3xl font-bold">
            0
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-sm text-slate-500">
            Situações de Aprendizagem
          </h2>

          <p className="mt-2 text-3xl font-bold">
            0
          </p>
        </div>
      </div>
    </main>
  );
}
