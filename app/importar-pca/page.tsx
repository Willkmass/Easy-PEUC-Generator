'use client';

import { useState } from 'react';

export default function ImportarPCAPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPdfJs = async () => {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const converterPaginasParaImagens = async (file: File): Promise<string[]> => {
    const pdfjsLib = await carregarPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const imagensBase64: string[] = [];

    const numPaginas = Math.min(pdf.numPages, 5);

    for (let i = 1; i <= numPaginas; i++) {
      setStatus(`Convertendo página ${i} de ${numPaginas} para imagem...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        imagensBase64.push(canvas.toDataURL('image/png').split(',')[1]);
      }
    }

    return imagensBase64;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResultado(null);
    setErro(null);

    try {
      setStatus('Iniciando processamento do arquivo PDF...');
      const imagensBase64 = await converterPaginasParaImagens(file);

      setStatus('Enviando para o Gemini e processando dados...');

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imagensBase64 }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Falha ao processar o arquivo.');

      // --- SALVAMENTO E SINCRONIZAÇÃO TOTALMENTE COMPATÍVEL ---
      if (resData.dados) {
        try {
          // Extrai e normaliza capacidades independentemente da estrutura que o Gemini retornar
          const normalizarCapacidades = (cap: any): string[] => {
            if (!cap) return [];
            if (Array.isArray(cap)) return cap.map(c => typeof c === 'string' ? c : (c.descricao || c.nome || JSON.stringify(c)));
            if (typeof cap === 'object') {
              const tecnicas = cap.tecnicas || cap.capacidades_tecnicas || [];
              const basicas = cap.basicas || cap.capacidades_basicas || [];
              const socio = cap.socioemocionais || cap.capacidades_socioemocionais || [];
              return [...tecnicas, ...basicas, ...socio].map(c => typeof c === 'string' ? c : (c.descricao || c.nome || String(c)));
            }
            return [String(cap)];
          };

          const ucsProcessadas = (resData.dados.unidades_curriculares || []).map((uc: any) => {
            const listaCapacidades = normalizarCapacidades(uc.capacidades);
            
            return {
              // Mantém TODAS as variações possíveis de chave para garantir compatibilidade total
              nome: uc.nome || uc.nomeUc || '',
              nomeUc: uc.nome || uc.nomeUc || '',
              nome_uc: uc.nome || uc.nomeUc || '',
              
              cargaHoraria: String(uc.carga_horaria || uc.cargaHoraria || '80'),
              carga_horaria: String(uc.carga_horaria || uc.cargaHoraria || '80'),
              
              modulo: uc.modulo || 'Módulo I',
              objetivo_geral: uc.objetivo || uc.objetivo_geral || '',
              competencias: uc.competencias || uc.competencia || '',
              
              // Garante que o array de capacidades esteja descompactado e plano
              capacidades: listaCapacidades,
              capacidades_tecnicas: uc.capacidades?.tecnicas || [],
              capacidades_basicas: uc.capacidades?.basicas || []
            };
          });

          const pcaParaSalvar = {
            nome: resData.dados.curso,
            nomeCurso: resData.dados.curso,
            modalidade: resData.dados.modalidade || 'Presencial',
            unidadesCurriculares: ucsProcessadas,
            ucs: ucsProcessadas
          };

          // Grava nas duas chaves possíveis consultadas pela aplicação
          const salvas = JSON.parse(localStorage.getItem('pcas_salvos') || '[]');
          const filtrados = salvas.filter((p: any) => (p.nome || p.nomeCurso) !== pcaParaSalvar.nome);
          filtrados.unshift(pcaParaSalvar);

          localStorage.setItem('pcas_salvos', JSON.stringify(filtrados));
          localStorage.setItem('cursos_peuc', JSON.stringify(filtrados));
        } catch (errLocal) {
          console.warn('Aviso: Erro ao sincronizar dados no localStorage', errLocal);
        }
      }

      setResultado(resData);
    } catch (err: any) {
      setErro(err.message || 'Erro durante a importação do PCA.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
          Importar Plano de Curso (PCA)
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Selecione um PDF do SENAI-PR para extrair a Categoria, Curso e Unidades Curriculares direto para a sua aplicação.
        </p>

        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            disabled={loading}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </div>

        {loading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-blue-700 font-medium animate-pulse text-sm">{status}</p>
          </div>
        )}

        {erro && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-600 text-sm font-medium">{erro}</p>
          </div>
        )}

        {resultado && (
          <div className="mt-6 rounded-lg bg-slate-50 p-6 border border-slate-200">
            <span className="inline-block rounded bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 mb-4">
              ✓ Cadastro e sincronização realizados com sucesso!
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-xs font-semibold uppercase text-slate-400 block">Categoria</span>
                <span className="font-bold text-blue-700">{resultado.dados.categoria}</span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-xs font-semibold uppercase text-slate-400 block">Nome do Curso</span>
                <span className="font-bold text-slate-900">{resultado.dados.curso}</span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-xs font-semibold uppercase text-slate-400 block">Carga Horária</span>
                <span className="font-bold text-slate-700">{resultado.dados.carga_horaria_total}</span>
              </div>
            </div>

            {resultado.dados.unidades_curriculares?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Unidades Curriculares Extraídas:</h3>
                <ul className="divide-y divide-slate-200 bg-white rounded border border-slate-200 text-sm">
                  {resultado.dados.unidades_curriculares.map((uc: any, idx: number) => (
                    <li key={idx} className="p-3 flex justify-between items-center">
                      <span className="font-medium text-slate-800">{uc.numero || idx + 1}. {uc.nome}</span>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{uc.carga_horaria}h</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
