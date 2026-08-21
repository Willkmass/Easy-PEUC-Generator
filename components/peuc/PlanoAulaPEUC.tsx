export default function PlanoAulaPEUC() {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold">
        Plano de Aula
      </h2>

      <table className="w-full border">
        <thead>
          <tr>
            <th className="border p-2">Nº Aulas</th>
            <th className="border p-2">Capacidades</th>
            <th className="border p-2">Conhecimentos</th>
            <th className="border p-2">Estratégias</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className="border p-2"></td>
            <td className="border p-2"></td>
            <td className="border p-2"></td>
            <td className="border p-2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
