"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PEUC } from "@/types";

import DadosGeraisPEUC from "@/components/peuc/DadosGeraisPEUC";
import CapacidadesPEUC from "@/components/peuc/CapacidadesPEUC";
import SituacaoAprendizagemPEUC from "@/components/peuc/SituacaoAprendizagemPEUC";
import PlanoAulaPEUC from "@/components/peuc/PlanoAulaPEUC";

export default function CriarPeucPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Estado unificado da PEUC
  const [formData, setFormData] = useState<Partial<PEUC>>({
    cursoId: "",
    unidadeCurricularId: "",
    docenteId: "",
    tipoSituacaoAprendizagem: "Situacao-Problema",
    integraOutraUC: false,
    contextualizacao: "",
    desafio: "",
    resultadosEsperados: "",
    capacidadesSelecionadasIds: [],
    conhecimentosSelecionadosIds: [],
    cronograma: [],
    status: "rascunho",
  });

  const handleFieldChange = (field: keyof PEUC, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvarPeuc = async () => {
    if (!formData.cursoId || !formData.unidadeCurricularId) {
      alert("Por favor, selecione o Curso e a Unidade Curricular antes de gerar.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Inserir Registro da PEUC
      const { data: peuc, error: peucError } = await supabase
        .from("peucs")
        .insert({
          curso_id: formData.cursoId,
          unidade_curricular_id: formData.unidadeCurricularId,
          docente_id: formData.docenteId,
          tipo_situacao_aprendizagem: formData.tipoSituacaoAprendizagem,
          integra_outra_uc: formData.integraOutraUC,
          contextualizacao: formData.contextualizacao,
          desafio: formData.desafio,
          resultados_esperados: formData.resultadosEsperados,
          status: formData.status,
        })
        .select()
        .single();

      if (peucError) throw peucError;

      // 2. Salvar Capacidades Selecionadas
      if (formData.capacidadesSelecionadasIds?.length) {
        const caps = formData.capacidadesSelecionadasIds.map((capId) => ({
          peuc_id: peuc.id,
          capacidade_id: capId,
        }));
        await supabase.from("peuc_capacidades").insert(caps);
      }

      // 3. Salvar Conhecimentos Selecionados
      if (formData.conhecimentosSelecionadosIds?.length) {
        const cons = formData.conhecimentosSelecionadosIds.map((conId) => ({
          peuc_id: peuc.id,
          conhecimento_id: conId,
        }));
        await supabase.from("peuc_conhecimentos").insert(cons);
      }

      // 4. Salvar Cronograma (Planos de Aula)
      if (formData.cronograma?.length) {
        for (const item of formData.cronograma) {
          const { data: plano, error: planoErr } = await supabase
            .from("planos_aula")
            .insert({
              peuc_id: peuc.id,
              numero_aulas: item.numeroAulas,
              estrategia_ensino: item.estrategiaEnsino,
              ambientes_recursos: item.ambientesERecursos,
            })
            .select()
            .single();

          if (planoErr) throw planoErr;

          // Relacionar Capacidades/Conhecimentos/Critérios da Aula
          if (item.capacidadesIds?.length) {
            await supabase.from("plano_aula_capacidades").insert(
              item.capacidadesIds.map((cId) => ({ plano_aula_id: plano.id, capacidade_id: cId }))
            );
          }
          if (item.conhecimentosIds?.length) {
            await supabase.from("plano_aula_conhecimentos").insert(
              item.conhecimentosIds.map((cId) => ({ plano_aula_id: plano.id, conhecimento_id: cId }))
            );
          }
        }
      }

      alert("PEUC cadastrada com sucesso!");
      router.push("/peuc");
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao salvar PEUC: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="space-y-6 p-8 max-w-5xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-slate-800">Nova PEUC</h1>
        <p className="text-slate-500 text-sm">
          Preencha a estrutura da PEUC com base nas informações do Plano de Curso.
        </p>
      </div>

      {/* Componentes com Estados Conectados */}
      <DadosGeraisPEUC data={formData} onChange={handleFieldChange} />
      
      <CapacidadesPEUC data={formData} onChange={handleFieldChange} />

      <SituacaoAprendizagemPEUC data={formData} onChange={handleFieldChange} />

      <PlanoAulaPEUC data={formData} onChange={handleFieldChange} />

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSalvarPeuc}
          disabled={isSaving}
          className="rounded-md bg-emerald-600 px-8 py-3 font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {isSaving ? "Salvando PEUC..." : "Gerar e Salvar PEUC"}
        </button>
      </div>
    </main>
  );
}
