import DadosGeraisPEUC from "../../../components/peuc/DadosGeraisPEUC";
import CapacidadesPEUC from "../../../components/peuc/CapacidadesPEUC";
import SituacaoAprendizagemPEUC from "../../../components/peuc/SituacaoAprendizagemPEUC";
import PlanoAulaPEUC from "../../../components/peuc/PlanoAulaPEUC";

export default function CriarPeucPage() {
  return (
    <main className="space-y-6 p-8">
      <h1 className="text-3xl font-bold">
        Nova PEUC
      </h1>

      <DadosGeraisPEUC />

      <CapacidadesPEUC />

      <SituacaoAprendizagemPEUC />

      <PlanoAulaPEUC />

      <button className="rounded bg-green-600 px-6 py-3 text-white">
        Gerar PEUC
      </button>
    </main>
  );
}
