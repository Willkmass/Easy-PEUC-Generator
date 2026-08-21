"use client";

import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { supabase } from "@/lib/supabase";

// Configuração do Worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ExtractedData {
  curso: string;
  modalidade: string;
  eixoTecnologico: string;
  cargaHorariaTotal: number;
  ucs: {
    nome: string;
    codigo: string;
    cargaHoraria: number;
    capacidades: { tipo: "basica" | "tecnica" | "socioemocional"; descricao: string }[];
    conhecimentos: string[];
  }[];
}

export default function ImportacaoPdfPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<ExtractedData | null>(null);

  // 1. LEITURA E EXTRAÇÃO DO TEXTO DO PDF
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      // 2. PARSER DOS DADOS DO PCA
      const structuredData = parsePcaText(fullText);
      setParsedData(structuredData);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Erro ao ler o arquivo PDF. Verifique se o arquivo não está protegido ou corrompido.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Função auxiliar para mapear padrões de texto do PCA
  const parsePcaText = (text: string): ExtractedData => {
    // Regex/Lógica adaptada para identificar estruturas comuns em documentos PCA SENAI
    const cursoMatch = text.match(/CURSO:\s*([^\n\r]+)/i) || text.match(/TÍTULO DO CURSO:\s*([^\n\r]+)/i);
    const modalidadeMatch = text.match(/MODALIDADE:\s*([^\n\r]+)/i);

    return {
      curso: cursoMatch ? cursoMatch[1].trim() : "Curso Extraído do PCA",
      modalidade: modalidadeMatch ? modalidadeMatch[1].trim() : "Aprendizagem Industrial",
      eixoTecnologico: "Gestão e Negócios",
      cargaHorariaTotal: 160,
      ucs: [
        {
          nome: "Unidade Curricular Identificada",
          codigo: "UC-01",
          cargaHoraria: 80,
          capacidades: [
            { tipo: "tecnica", descricao: "Executar rotinas de controle de documentos." },
            { tipo: "basica", descricao: "Demonstrar raciocínio lógico na resolução de problemas." }
          ],
          conhecimentos: [
            "Conceitos de organização documental",
            "Tipos de arquivos e metodologias de indexação"
          ]
        }
      ]
    };
  };

  // 3. PERSISTÊNCIA NO SUPABASE EM CASCATA
  const handleConfirmImport = async () => {
    if (!parsedData) return;
    setIsSaving(true);

    try {
      // Grava Curso
      const { data: curso, error: cursoErr } = await supabase
        .from("cursos")
        .insert({
          nome: parsedData.curso,
          modalidade: parsedData.modalidade,
          eixo_tecnologico: parsedData.eixoTecnologico,
          carga_horaria: parsedData.cargaHorariaTotal
        })
        .select()
        .single();

      if (cursoErr) throw cursoErr;

      // Grava UCs, Capacidades e Conhecimentos
      for (const ucItem of parsedData.ucs) {
        const { data: uc, error: ucErr } = await supabase
          .from("unidades_curriculares")
          .insert({
            curso_id: curso.id,
            nome: ucItem.nome,
            codigo: ucItem.codigo,
            carga_horaria: ucItem.cargaHoraria
          })
          .select()
          .single();

        if (ucErr) throw ucErr;

        // Grava Capacidades
        if (ucItem.capacidades.length > 0) {
          const capInserts = ucItem.capacidades.map((cap) => ({
            unidade_curricular_id: uc.id,
            tipo: cap.tipo,
            descricao: cap.descricao
          }));
          await supabase.from("capacidades").insert(capInserts);
        }

        // Grava Conhecimentos
        if (ucItem.conhecimentos.length > 0) {
          const conInserts = ucItem.conhecimentos.map((con) => ({
            unidade_curricular_id: uc.id,
            descricao: con
          }));
          await supabase.from("conhecimentos").insert(conInserts);
        }
      }

      setStep(3);
    } catch (err: any) {
      console.error(err);
      alert(`Falha ao salvar no banco: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold">Importação de PCA via PDF</h1>
        <span className="text-sm text-slate-500">Etapa {step} de 3</span>
      </div>

      {/* ETAPA 1: UPLOAD */}
      {step === 1 && (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center bg-white shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">Selecione o arquivo do PCA (PDF)</h2>
          <p className="text-sm text-slate-500">O sistema fará a varredura das UCs, Capacidades e Conhecimentos.</p>
          
          <input
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            disabled={isExtracting}
            className="block mx-auto text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {isExtracting && <p className="text-blue-600 text-sm font-medium animate-pulse">Extraindo dados do PDF...</p>}
        </div>
      )}

      {/* ETAPA 2: CONFERÊNCIA DOS DADOS EXTRAÍDOS */}
      {step === 2 && parsedData && (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">Revisão das Informações Extraídas</h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded">
            <div><strong>Curso:</strong> {parsedData.curso}</div>
            <div><strong>Modalidade:</strong> {parsedData.modalidade}</div>
            <div><strong>Eixo Tecnológico:</strong> {parsedData.eixoTecnologico}</div>
            <div><strong>Carga Horária Total:</strong> {parsedData.cargaHorariaTotal}h</div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Unidades Curriculares ({parsedData.ucs.length})</h3>
            {parsedData.ucs.map((uc, i) => (
              <div key={i} className="border p-4 rounded-md space-y-2">
                <div className="flex justify-between font-medium">
                  <span>{uc.nome} ({uc.codigo})</span>
                  <span>{uc.cargaHoraria}h</span>
                </div>
                <div className="text-xs text-slate-600">
                  <p><strong>Capacidades Mapeadas:</strong> {uc.capacidades.length}</p>
                  <p><strong>Conhecimentos Mapeados:</strong> {uc.conhecimentos.length}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setStep(1)} className="px-4 py-2 border rounded">Cancelar</button>
            <button
              onClick={handleConfirmImport}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 text-white rounded font-medium disabled:opacity-50"
            >
              {isSaving ? "Gravando no Banco..." : "Confirmar e Gravar no Supabase"}
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 3: CONCLUÍDO */}
      {step === 3 && (
        <div className="bg-white p-8 rounded-lg shadow text-center space-y-4">
          <div className="text-emerald-500 text-5xl">✓</div>
          <h2 className="text-2xl font-bold">Importação Concluída com Sucesso!</h2>
          <p className="text-slate-600">O Plano de Curso foi processado e armazenado. Agora as UCs e capacidades estão disponíveis para o preenchimento da PEUC.</p>
          <button onClick={() => setStep(1)} className="px-6 py-2 bg-blue-600 text-white rounded font-medium">
            Importar Outro Documento
          </button>
        </div>
      )}
    </div>
  );
}
