'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function ImportarPCAPage() {
  // Ferramenta de Divisão
  const [pdfParaDividir, setPdfParaDividir] = useState(null);
  const [infoPdf, setInfoPdf] = useState(null);
  const [modoDivisao, setModoDivisao] = useState('intervalo');
  const [paginaInicio, setPaginaInicio] = useState(1);
  const [paginaFim, setPaginaFim] = useState(1);
  const [tamanhoBloco, setTamanhoBloco] = useState(10);
  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [arquivosGerados, setArquivosGerados] = useState([]);

  // Importação e Ingestão
  const [arquivosImportacao, setArquivosImportacao] = useState([]);
  const [carregandoImportacao, setCarregandoImportacao] = useState(false);
  const [resultadoExtracao, setResultadoExtracao] = useState(null);
  const [erroImportacao, setErroImportacao] = useState(null);

  const handleCarregarPdfParaDividir = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const total = pdfDoc.getPageCount();

      setPdfParaDividir(file);
      setInfoPdf({
        nome: file.name,
        totalPaginas: total,
        arrayBuffer: arrayBuffer
      });
      setPaginaInicio(1);
      setPaginaFim(total);
      setArquivosGerados([]);
    } catch (err) {
      alert('Erro ao ler o arquivo PDF. Certifique-se de que o documento é válido.');
    }
  };

  const handleExecutarDivisao = async () => {
    if (!infoPdf) return;
    setProcessandoPdf(true);
    setArquivosGerados([]);

    try {
      const docOriginal = await PDFDocument.load(infoPdf.arrayBuffer);
      const novosPdfs = [];

      if (modoDivisao === 'intervalo') {
        const inicio = Math.max(1, Math.min(Number(paginaInicio), infoPdf.totalPaginas));
        const fim = Math.min(Math.max(inicio, Number(paginaFim)), infoPdf.totalPaginas);

        const novoDoc = await PDFDocument.create();
        const indices = Array.from({ length: fim - inicio + 1 }, (_, i) => (inicio - 1) + i);
        const paginasCopiadas = await novoDoc.copyPages(docOriginal, indices);
        paginasCopiadas.forEach(p => novoDoc.addPage(p));

        const bytes = await novoDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const nomeArquivo = `${infoPdf.nome.replace('.pdf', '')}_paginas_${inicio}_a_${fim}.pdf`;

        novosPdfs.push({
          nome: nomeArquivo,
          blobUrl: url,
          totalPaginas: indices.length
        });
      } else {
        const bloco = Math.max(1, Number(tamanhoBloco));
        let contador = 1;

        for (let i = 0; i < infoPdf.totalPaginas; i += bloco) {
          const fimBloco = Math.min(i + bloco, infoPdf.totalPaginas);
          const novoDoc = await PDFDocument.create();
          const indices = Array.from({ length: fimBloco - i }, (_, idx) => i + idx);
          const paginasCopiadas = await novoDoc.copyPages(docOriginal, indices);
          paginasCopiadas.forEach(p => novoDoc.addPage(p));

          const bytes = await novoDoc.save();
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const nomeArquivo = `${infoPdf.nome.replace('.pdf', '')}_parte_${contador}.pdf`;

          novosPdfs.push({
            nome: nomeArquivo,
            blobUrl: url,
            totalPaginas: indices.length
          });
          contador++;
        }
      }

      setArquivosGerados(novosPdfs);
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao dividir o PDF.');
    } finally {
      setProcessandoPdf(false);
    }
  };

  const handleEnviarParaApi = async (e) => {
    e.preventDefault();
    if (arquivosImportacao.length === 0) return;

    setCarregandoImportacao(true);
    setErroImportacao(null);
    setResultadoExtracao(null);

    try {
      const formData = new FormData();
      Array.from(arquivosImportacao).forEach((file) => {
        formData.append('arquivos', file);
      });

      const response = await fetch('/api/ingestao-pdf', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Erro no processamento.');
      }

      // Atualiza o estado visual imediato
      setResultadoExtracao(json.data);

      // Persiste no localStorage para ler na aba Cursos
      const cursosExistentes = JSON.parse(localStorage.getItem('cursos_peuc') || '[]');
      const novoCurso = {
        id: Date.now(),
        nomeCurso: json.data.nomeCurso || 'Curso Sem Nome',
        unidadesCurriculares: json.data.unidadesCurriculares || [],
        criadoEm: new Date().toISOString()
      };

      cursosExistentes.push(novoCurso);
      localStorage.setItem('cursos_peuc', JSON.stringify(cursosExistentes));

    } catch (err) {
      setErroImportacao(err.message || 'Falha ao processar o arquivo.');
    } finally {
      setCarregandoImportacao(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 p-6 md:p-10 space-y-8">
      {/* Header Principal */}
      <div className="space-y-2">
        <div className="flex gap-2 mb-2">
          <span className="text-[11px] font-bold tracking-wider uppercase bg-[#181c33] text-indigo-300 px-3 py-1 rounded-full border border-indigo-900/40">
            EASY PEUC GENERATOR
          </span>
          <span className="text-[11px] font-bold tracking-wider uppercase bg-[#14182b] text-slate-400 px-3 py-1 rounded-full border border-slate-800">
            Importador PCA
          </span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Importação de PCA & Ferramentas
        </h1>
        <p className="text-sm text-slate-400">
          Gerencie PDFs extensos e faça a ingestão de Planos de Curso (SENAI-PR).
        </p>
      </div>

      {/* FERRAMENTA DE DIVISÃO DE PDF */}
      <div className="bg-[#0f1222] border border-slate-800/80 rounded-xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Ferramenta: Divisor de PDF Extenso</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Use esta ferramenta para cortar um PDF grande antes de realizar a importação.
            </p>
          </div>
          <span className="text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full">
            Utilitário
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Selecione o PDF Extenso:
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleCarregarPdfParaDividir}
              className="block w-full text-xs text-slate-300 border border-slate-800 rounded-lg bg-[#161a30] p-2.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
          </div>

          {infoPdf && (
            <div className="bg-[#161a30] p-3 rounded-lg border border-slate-800 text-sm space-y-1">
              <p className="font-bold text-white truncate">{infoPdf.nome}</p>
              <p className="text-xs text-slate-400">
                Total de Páginas: <span className="font-bold text-indigo-400">{infoPdf.totalPaginas}</span>
              </p>
            </div>
          )}
        </div>

        {infoPdf && (
          <div className="bg-[#14172b] p-4 rounded-lg border border-slate-800 space-y-4">
            <div className="flex gap-6 border-b border-slate-800 pb-3">
              <label className="flex items-center gap-2 text-sm text-slate-300 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="modo"
                  value="intervalo"
                  checked={modoDivisao === 'intervalo'}
                  onChange={() => setModoDivisao('intervalo')}
                  className="accent-indigo-500"
                />
                Extrair Intervalo Específico
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="modo"
                  value="blocos"
                  checked={modoDivisao === 'blocos'}
                  onChange={() => setModoDivisao('blocos')}
                  className="accent-indigo-500"
                />
                Dividir em Partes Igualitárias
              </label>
            </div>

            {modoDivisao === 'intervalo' ? (
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span>Extrair da página</span>
                <input
                  type="number"
                  min="1"
                  max={infoPdf.totalPaginas}
                  value={paginaInicio}
                  onChange={(e) => setPaginaInicio(e.target.value)}
                  className="w-20 bg-[#0b0d19] border border-slate-700 p-1.5 rounded text-center text-white font-semibold focus:outline-none focus:border-indigo-500"
                />
                <span>até a página</span>
                <input
                  type="number"
                  min="1"
                  max={infoPdf.totalPaginas}
                  value={paginaFim}
                  onChange={(e) => setPaginaFim(e.target.value)}
                  className="w-20 bg-[#0b0d19] border border-slate-700 p-1.5 rounded text-center text-white font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span>Dividir arquivo a cada</span>
                <input
                  type="number"
                  min="1"
                  max={infoPdf.totalPaginas}
                  value={tamanhoBloco}
                  onChange={(e) => setTamanhoBloco(e.target.value)}
                  className="w-20 bg-[#0b0d19] border border-slate-700 p-1.5 rounded text-center text-white font-semibold focus:outline-none focus:border-indigo-500"
                />
                <span>páginas</span>
              </div>
            )}

            <button
              onClick={handleExecutarDivisao}
              disabled={processandoPdf}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:bg-slate-800 disabled:text-slate-500 transition-colors"
            >
              {processandoPdf ? 'Processando Divisão...' : 'Gerar Arquivos Divididos'}
            </button>
          </div>
        )}

        {arquivosGerados.length > 0 && (
          <div className="bg-[#14172b] p-4 rounded-lg border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Arquivos Prontos para Download:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {arquivosGerados.map((arq, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 border border-slate-800 rounded-lg bg-[#0b0d19] text-xs">
                  <div>
                    <p className="font-bold text-slate-200 truncate max-w-[200px]">{arq.nome}</p>
                    <p className="text-slate-500">{arq.totalPaginas} página(s)</p>
                  </div>
                  <a
                    href={arq.blobUrl}
                    download={arq.nome}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                  >
                    Baixar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ÁREA DE IMPORTAÇÃO */}
      <div className="bg-[#0f1222] border border-slate-800/80 rounded-xl p-6 space-y-6 shadow-xl">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
          Importar PCA para a Plataforma
        </h2>

        <form onSubmit={handleEnviarParaApi} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Selecione o(s) arquivo(s) PDF da PCA para processamento:
            </label>
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e) => setArquivosImportacao(e.target.files)}
              disabled={carregandoImportacao}
              className="block w-full text-xs text-slate-300 border border-slate-800 rounded-lg bg-[#161a30] p-2.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={carregandoImportacao || !arquivosImportacao || arquivosImportacao.length === 0}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm disabled:bg-slate-800 disabled:text-slate-500 transition-colors shadow-md"
          >
            {carregandoImportacao ? 'Extraindo Dados via Gemini...' : 'Processar PCA Selecionado(s)'}
          </button>
        </form>

        {erroImportacao && (
          <div className="p-3 bg-red-950/40 text-red-300 border border-red-800/60 rounded-lg text-sm font-medium">
            {erroImportacao}
          </div>
        )}

        {resultadoExtracao && (
          <div className="mt-6 border border-slate-800 p-5 rounded-xl bg-[#14172b] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-emerald-400">
                Curso: {resultadoExtracao.nomeCurso || 'Nome não identificado'}
              </h3>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-1 rounded-full">
                Salvo com sucesso!
              </span>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Unidades Curriculares ({resultadoExtracao.unidadesCurriculares?.length || 0}):
              </h4>
              {resultadoExtracao.unidadesCurriculares?.map((uc, idx) => (
                <div key={idx} className="bg-[#0b0d19] p-4 rounded-lg border border-slate-800/80 text-sm space-y-1.5">
                  <p className="font-bold text-white text-base">
                    {uc.nomeUc} {uc.cargaHoraria && <span className="text-xs font-semibold text-indigo-400">({uc.cargaHoraria})</span>}
                  </p>
                  {uc.capacidades?.length > 0 && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-semibold text-slate-400">Capacidades:</span> {uc.capacidades.join('; ')}
                    </p>
                  )}
                  {uc.conhecimentos?.length > 0 && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-semibold text-slate-400">Conhecimentos:</span> {uc.conhecimentos.join('; ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
