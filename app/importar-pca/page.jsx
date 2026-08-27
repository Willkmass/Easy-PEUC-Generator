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
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Importação de PCA & Ferramentas
          </h1>
          <p className="text-base text-slate-500 mt-1">
            Gerencie PDFs extensos e faça a ingestão inteligente de Planos de Curso.
          </p>
        </div>
      </div>

      {/* FERRAMENTA DE DIVISÃO DE PDF */}
      <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border border-amber-200/80 rounded-2xl shadow-sm overflow-hidden transition-all">
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-lg">
                ✂️
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-950">Divisor de PDF Extenso</h2>
                <p className="text-sm text-amber-700/80">
                  Corte ou fracione documentos grandes antes de iniciar a importação de dados.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full border border-amber-200">
              Utilitário
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Selecione o PDF Extenso:
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleCarregarPdfParaDividir}
                className="block w-full text-sm text-slate-600 border border-amber-200 rounded-xl bg-white p-2.5 shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 transition-all cursor-pointer"
              />
            </div>

            {infoPdf && (
              <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-sm space-y-1">
                <p className="font-semibold text-slate-800 truncate text-sm">{infoPdf.nome}</p>
                <p className="text-xs text-slate-500">
                  Total de Páginas: <span className="font-bold text-amber-700 text-sm">{infoPdf.totalPaginas}</span>
                </p>
              </div>
            )}
          </div>

          {infoPdf && (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-amber-200/60 space-y-6 shadow-sm">
              <div className="flex flex-wrap gap-6 border-b border-slate-100 pb-4">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="modo"
                    value="intervalo"
                    checked={modoDivisao === 'intervalo'}
                    onChange={() => setModoDivisao('intervalo')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  Extrair Intervalo Específico
                </label>
                <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="modo"
                    value="blocos"
                    checked={modoDivisao === 'blocos'}
                    onChange={() => setModoDivisao('blocos')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  Dividir em Partes Igualitárias
                </label>
              </div>

              {modoDivisao === 'intervalo' ? (
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
                  <span>Extrair da página</span>
                  <input
                    type="number"
                    min="1"
                    max={infoPdf.totalPaginas}
                    value={paginaInicio}
                    onChange={(e) => setPaginaInicio(e.target.value)}
                    className="w-24 border border-slate-300 p-2 rounded-lg text-center font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span>até a página</span>
                  <input
                    type="number"
                    min="1"
                    max={infoPdf.totalPaginas}
                    value={paginaFim}
                    onChange={(e) => setPaginaFim(e.target.value)}
                    className="w-24 border border-slate-300 p-2 rounded-lg text-center font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
                  <span>Dividir arquivo a cada</span>
                  <input
                    type="number"
                    min="1"
                    max={infoPdf.totalPaginas}
                    value={tamanhoBloco}
                    onChange={(e) => setTamanhoBloco(e.target.value)}
                    className="w-24 border border-slate-300 p-2 rounded-lg text-center font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span>páginas</span>
                </div>
              )}

              <button
                onClick={handleExecutarDivisao}
                disabled={processandoPdf}
                className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:from-amber-700 hover:to-amber-800 focus:ring-2 focus:ring-amber-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {processandoPdf ? 'Processando Divisão...' : 'Gerar Arquivos Divididos'}
              </button>
            </div>
          )}

          {arquivosGerados.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-amber-200/80 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700">Arquivos Prontos para Download:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {arquivosGerados.map((arq, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-xs hover:border-slate-300 transition-all">
                    <div className="pr-2">
                      <p className="font-bold text-slate-800 truncate max-w-[200px]">{arq.nome}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{arq.totalPaginas} página(s)</p>
                    </div>
                    <a
                      href={arq.blobUrl}
                      download={arq.nome}
                      className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-all whitespace-nowrap"
                    >
                      Baixar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ÁREA DE IMPORTAÇÃO */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            📥
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Importar PCA para a Plataforma</h2>
            <p className="text-sm text-slate-500">Suba o arquivo PDF final para a IA extrair os módulos e competências.</p>
          </div>
        </div>

        <form onSubmit={handleEnviarParaApi} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Selecione o(s) arquivo(s) PDF da PCA para processamento:
            </label>
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e) => setArquivosImportacao(e.target.files)}
              disabled={carregandoImportacao}
              className="block w-full text-sm text-slate-600 border border-slate-300 rounded-xl bg-slate-50 p-3 shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all cursor-pointer disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={carregandoImportacao || !arquivosImportacao || arquivosImportacao.length === 0}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold text-sm shadow-md hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {carregandoImportacao ? 'Extraindo Dados via Gemini...' : 'Processar PCA Selecionado(s)'}
          </button>
        </form>

        {erroImportacao && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
            {erroImportacao}
          </div>
        )}

        {resultadoExtracao && (
          <div className="mt-8 border border-emerald-200 p-6 rounded-2xl bg-emerald-50/40 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-4">
              <h3 className="text-lg font-bold text-emerald-900">
                Curso: {resultadoExtracao.nomeCurso || 'Nome não identificado'}
              </h3>
              <span className="self-start sm:self-auto text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                Salvo com sucesso!
              </span>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700 text-sm">
                Unidades Curriculares ({resultadoExtracao.unidadesCurriculares?.length || 0}):
              </h4>
              <div className="space-y-3">
                {resultadoExtracao.unidadesCurriculares?.map((uc, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                    <p className="font-bold text-slate-800 text-base">
                      {uc.nomeUc} {uc.cargaHoraria && <span className="text-sm font-semibold text-blue-600">({uc.cargaHoraria})</span>}
                    </p>
                    {uc.capacidades?.length > 0 && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-800">Capacidades:</span> {uc.capacidades.join('; ')}
                      </p>
                    )}
                    {uc.conhecimentos?.length > 0 && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-800">Conhecimentos:</span> {uc.conhecimentos.join('; ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
