export default function MappingFields() {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-xl font-semibold">
        Mapeamento de Colunas
      </h2>

      <p className="mt-2 text-slate-600">
        Associe as colunas da planilha aos campos do sistema.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">
            Nome UC
          </label>
          <select className="mt-1 w-full rounded border p-2">
            <option>unidade_curricular</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Carga Horária
          </label>
          <select className="mt-1 w-full rounded border p-2">
            <option>carga_horaria</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Capacidades
          </label>
          <select className="mt-1 w-full rounded border p-2">
            <option>capacidades</option>
          </select>
        </div>
      <
