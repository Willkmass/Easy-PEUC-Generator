export default function UploadExcel() {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <h2 className="text-xl font-semibold">
        Upload de Planilha
      </h2>

      <p className="mt-3 text-slate-600">
        Selecione um arquivo .xlsx para importação.
      </p>

      <input
        className="mt-4"
        type="file"
        accept=".xlsx"
      />
    </div>
  );
}
