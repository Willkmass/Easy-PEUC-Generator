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
          docente_id: formData.docenteId || null,
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

      // 2. Salvar Capacidades Selecionadas (Em Lote)
      if (formData.capacidadesSelecionadasIds?.length) {
        const caps = formData.capacidadesSelecionadasIds.map((cap) => ({
          peuc_id: peuc.id,
          capacidade_id: typeof cap === "object" ? (cap as any).id : cap,
        }));
        const { error: capErr } = await supabase.from("peuc_capacidades").insert(caps);
        if (capErr) console.error("Erro ao salvar capacidades:", capErr);
      }

      // 3. Salvar Conhecimentos Selecionados (Em Lote)
      if (formData.conhecimentosSelecionadosIds?.length) {
        const cons = formData.conhecimentosSelecionadosIds.map((con) => ({
          peuc_id: peuc.id,
          conhecimento_id: typeof con === "object" ? (con as any).id : con,
        }));
        const { error: conErr } = await supabase.from("peuc_conhecimentos").insert(cons);
        if (conErr) console.error("Erro ao salvar conhecimentos:", conErr);
      }

      // 4. Salvar Cronograma (Processamento Seguro em Lote sem perda de linhas)
      if (formData.cronograma?.length) {
        await Promise.all(
          formData.cronograma.map(async (item) => {
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

            // Insere relacionamentos das aulas sem interromper o laço
            const promessasAula = [];

            if (item.capacidadesIds?.length) {
              const capsAula = item.capacidadesIds.map((c) => ({
                plano_aula_id: plano.id,
                capacidade_id: typeof c === "object" ? (c as any).id : c,
              }));
              promessasAula.push(supabase.from("plano_aula_capacidades").insert(capsAula));
            }

            if (item.conhecimentosIds?.length) {
              const consAula = item.conhecimentosIds.map((c) => ({
                plano_aula_id: plano.id,
                conhecimento_id: typeof c === "object" ? (c as any).id : c,
              }));
              promessasAula.push(supabase.from("plano_aula_conhecimentos").insert(consAula));
            }

            await Promise.all(promessasAula);
          })
        );
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
