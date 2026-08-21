export default function SituacaoAprendizagemPEUC() {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold">
        Situação de Aprendizagem
      </h2>

      <textarea
        className="mb-4 h-32 w-full rounded border p-3"
        placeholder="Contextualização"
      />

      <textarea
        className="mb-4 h-32 w-full rounded border p-3"
        placeholder="Desafio"
      />

      <textarea
        className="h-32 w-full rounded border p-3"
        placeholder="Resultados Esperados"
      />
    </div>
  );
}
