export default function CapacidadesPEUC() {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold">
        Capacidades
      </h2>

      <textarea
        className="mb-4 h-32 w-full rounded border p-3"
        placeholder="Capacidades Básicas"
      />

      <textarea
        className="mb-4 h-32 w-full rounded border p-3"
        placeholder="Capacidades Técnicas"
      />

      <textarea
        className="h-32 w-full rounded border p-3"
        placeholder="Capacidades Socioemocionais"
      />
    </div>
  );
}
