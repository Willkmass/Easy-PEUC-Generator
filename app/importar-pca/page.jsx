'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function ImportarPCAPage() {
  // --- ESTADOS DA FERRAMENTA DE DIVISÃO DE PDF ---
  const [pdfParaDividir, setPdfParaDividir] = useState(null);
  const [infoPdf, setInfoPdf] = useState(null); // { nome, totalPaginas, buffer }
  const [modoDivisao, setModoDivisao] = useState('intervalo'); // 'intervalo' ou 'blocos'
  
  // Opção A: Intervalo Personalizado (ex: pág 1 até 15)
  const [paginaInicio, setPaginaInicio] = useState(1);
  const [paginaFim, setPaginaFim] = useState(1);

  // Opção B: Blocos Fixos (ex: dividir a cada 10 páginas)
  const [tamanhoBloco, setTamanhoBloco] = useState(10);

  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [arquivosGerados, setArquivosGerados] = useState([]); // [{ nome, blobUrl, totalPaginas }]

  // --- ESTADOS DA IMPORTAÇÃO DE PCA ---
  const [arquivosImportacao, setArquivosImportacao] = useState([]);
  const [carregandoImportacao, setCarregandoImportacao] = useState(false);
  const [resultadoExtracao, setResultadoExtracao] = useState(null);
  const [erroImportacao, setErroImportacao] = useState(null);

  // 1. Carrega o arquivo na Ferramenta de Divisão
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

  // 2. Executa a Divisão Manual e gera Links para Download
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
        // Blocos Fixos
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

  // 3. Processamento do Upload para a API de Ingestão
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

      setResultadoExtracao(json.data);
    } catch (err) {
      setErroImportacao(err.message || 'Falha ao processar o arquivo.');
    } finally {
      setCarregandoImportacao(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Importação de PCA & Ferramentas</h1>
        <p className="text-sm text-gray-600">Gerencie PDFs extensos e faça a ingestão de Planos de Curso.</p>
      </div>

      {/* SEÇÃO 1: FERRAMENTA DE DIVISÃO DE PDF */}
      <div className="bg-amber-50 border border-amber-200 p-5 rounded-lg space-y-4">
        <div className="flex items-center justify-between border-b border-amber-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-amber-900">Ferramenta: Divisor de PDF Extenso</h2>
            <p className="text-xs text-amber-700">Use esta ferramenta para cortar um PDF grande antes de realizar a importação.</p>
          </div>
          <span className="text-xs font-semibold bg-amber-200 text-amber-800 px-2.5 py-1 rounded">Utilitário</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o PDF Extenso:</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleCarregarPdfParaDividir}
              className="block w-full text-sm border p-2 rounded bg-white"
            />
          </div>

          {infoPdf && (
            <div className="bg-white p-3 rounded border text-sm space-y-1">
              <p className="font-bold text-gray-800 truncate">{infoPdf.nome}</p>
              <p className="text-xs text-gray-600">Total de Páginas: <span className="font-semibold text-blue-600">{infoPdf.totalPaginas}</span></p>
            </div>
          )}
        </div>

        {infoPdf && (
          <div className="bg-white p-4 rounded border space-y-4">
            <div className="flex gap-4 border-b pb-3">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="modo"
                  value="intervalo"
                  checked={modoDivisao === 'intervalo'}
                  onChange={() => setModoDivisao('intervalo')}
                />
                Extrair Intervalo Específico
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="modo"
                  value="blocos"
                  checked={modoDivisao === 'blocos'}
                  onChange={() => setModoDivisao('blocos')}
                />
                Dividir em Partes Egualitárias
              </label>
            </div>

            {modoDivisao === 'intervalo' ? (
              <div className="flex items-center gap-3 text-sm">
                <span>Extrair da página</span>
                <input
                  type="number"
                  min="1"
                  max={infoPdf.totalPaginas}
                  value={paginaInicio}
                  onChange={(e) => setPaginaInicio(e.target.value)}
                  className="w-20 border p-1 rounded text-center"
                />
                <span>até a página</span>
                <input
                  type="number"
                  min="1"
                  max={infoPdf.totalPaginas}
                  value={paginaFim}
                  onChange={(e) => setPaginaFim(e.target.value)}
                  className="w-20 border p-1 rounded text-center"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <span>Dividir arquivo a cada</span>
                <input
                  type="number"
                  min="1"
                  max={infoPdf.totalPaginas}
                  value={tamanhoBloco}
                  onChange={(e) => setTamanhoBloco(e.target.value)}
                  className="w-20 border p-1 rounded text-center"
                />
                <span>páginas</span>
              </div>
            )}

            <button
              onClick={handleExecutarDivisao}
              disabled={processandoPdf}
              className="bg-amber-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-amber-700 disabled:bg-gray-400"
            >
              {processandoPdf ? 'Processando Divisão...' : 'Gerar Arquivos Divididos'}
            </button>
          </div>
        )}

        {/* Lista de Arquivos Gerados para Download */}
        {arquivosGerados.length > 0 && (
          <div className="bg-white p-4 rounded border space-y-3">
            <h3 className="text-sm font-bold text-gray-700">Arquivos Prontos para Download:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {arquivosGerados.map((arq, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 border rounded bg-gray-50 text-xs">
                  <div>
                    <p className="font-bold text-gray-800 truncate max-w-[200px]">{arq.nome}</p>
                    <p className="text-gray-500">{arq.totalPaginas} página(s)</p>
                  </div>
                  <a
                    href={arq.blobUrl}
                    download={arq.nome}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-700"
                  >
                    Baixar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <hr className="border-gray-200" />

      {/* SEÇÃO 2: IMPORTAÇÃO E EXTRAÇÃO DE PCA */}
      <div className="bg-white p-5 rounded-lg border shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Importar PCA para a Plataforma</h2>

        <form onSubmit={handleEnviarParaApi} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecione o(s) arquivo(s) PDF da PCA para processamento:
            </label>
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e) => setArquivosImportacao(e.target.files)}
              disabled={carregandoImportacao}
              className="block w-full text-sm border p-2 rounded bg-gray-50"
            />
          </div>

          <button
            type="submit"
            disabled={carregandoImportacao || !arquivosImportacao || arquivosImportacao.length === 0}
            className="bg-blue-600 text-white px-5 py-2 rounded font-medium text-sm hover:bg-blue-700 disabled:bg-gray-400"
          >
            {carregandoImportacao ? 'Extraindo Dados via Gemini...' : 'Processar PCA Selecionado(s)'}
          </button>
        </form>

        {erroImportacao && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
            {erroImportacao}
          </div>
        )}

        {resultadoExtracao && (
          <div className="mt-6 border p-4 rounded-lg bg-gray-50 space-y-4">
            <h3 className="text-lg font-bold text-green-700">
              Curso: {resultadoExtracao.nomeCurso || 'Nome não identificado'}
            </h3>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Unidades Curriculares ({resultadoExtracao.unidadesCurriculares?.length || 0}):</h4>
              {resultadoExtracao.unidadesCurriculares?.map((uc, idx) => (
                <div key={idx} className="bg-white p-3 rounded border text-sm space-y-1">
                  <p className="font-bold text-gray-800">{uc.nomeUc} {uc.cargaHoraria && `(${uc.cargaHoraria})`}</p>
                  {uc.capacidades?.length > 0 && (
                    <p><span className="font-medium">Capacidades:</span> {uc.capacidades.join('; ')}</p>
                  )}
                  {uc.conhecimentos?.length > 0 && (
                    <p><span className="font-medium">Conhecimentos:</span> {uc.conhecimentos.join('; ')}</p>
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
