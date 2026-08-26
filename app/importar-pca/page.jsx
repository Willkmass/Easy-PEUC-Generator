'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function ImportarPCAPage() {
  const [arquivos, setArquivos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  // Divide um PDF grande em blocos menores (ex: 10 páginas por bloco)
  const fatiarPdf = async (arquivoOriginal, paginasPorParte = 10) => {
    const arrayBuffer = await arquivoOriginal.arrayBuffer();
    const docOriginal = await PDFDocument.load(arrayBuffer);
    const totalPaginas = docOriginal.getPageCount();

    if (totalPaginas <= paginasPorParte) {
      return [arquivoOriginal]; // Se for pequeno, envia o arquivo original inteiro
    }

    const partes = [];
    let contadorParte = 1;

    for (let i = 0; i < totalPaginas; i += paginasPorParte) {
      const novoDoc = await PDFDocument.create();
      const paginasParaCopiar = Array.from(
        { length: Math.min(paginasPorParte, totalPaginas - i) },
        (_, idx) => i + idx
      );

      const paginasCopiadas = await novoDoc.copyPages(docOriginal, paginasParaCopiar);
      paginasCopiadas.forEach(p => novoDoc.addPage(p));

      const bytesPdf = await novoDoc.save();
      const blob = new Blob([bytesPdf], { type: 'application/pdf' });
      const novoArquivo = new File(
        [blob],
        `${arquivoOriginal.name.replace('.pdf', '')}_parte_${contadorParte}.pdf`,
        { type: 'application/pdf' }
      );

      partes.push(novoArquivo);
      contadorParte++;
    }

    return partes;
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setArquivos(Array.from(e.target.files));
      setResultado(null);
      setErro(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (arquivos.length === 0) {
      setErro('Selecione pelo menos um arquivo PDF.');
      return;
    }

    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      const arquivosParaEnviar = [];

      // Processa e fatia cada PDF selecionado se necessário
      for (let i = 0; i < arquivos.length; i++) {
        const arq = arquivos[i];
        setProgresso(`Analisando e dividindo arquivo ${i + 1} de ${arquivos.length}...`);
        
        const partes = await fatiarPdf(arq, 10); // Divisão de 10 em 10 páginas
        arquivosParaEnviar.push(...partes);
      }

      setProgresso(`Enviando ${arquivosParaEnviar.length} parte(s) para extração via Gemini API...`);

      const formData = new FormData();
      arquivosParaEnviar.forEach((file) => {
        formData.append('arquivos', file);
      });

      const response = await fetch('/api/ingestao-pdf', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Falha ao processar os arquivos.');
      }

      setResultado(json.data);
    } catch (err) {
      console.error(err);
      setErro(err.message || 'Ocorreu um erro durante a ingestão.');
    } finally {
      setCarregando(false);
      setProgresso('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Importar PCA (Plano de Curso)</h1>

      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-white shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">
            Selecione o(s) arquivo(s) PDF da PCA:
          </label>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
            disabled={carregando}
            className="block w-full text-sm border p-2 rounded"
          />
        </div>

        {arquivos.length > 0 && (
          <p className="text-xs text-gray-600">
            {arquivos.length} arquivo(s) selecionado(s).
          </p>
        )}

        <button
          type="submit"
          disabled={carregando || arquivos.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {carregando ? 'Processando...' : 'Fatiar e Processar PCA'}
        </button>
      </form>

      {progresso && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded text-sm animate-pulse">
          {progresso}
        </div>
      )}

      {erro && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
          {erro}
        </div>
      )}

      {resultado && (
        <div className="mt-6 border p-4 rounded-lg bg-gray-50 space-y-4">
          <h2 className="text-xl font-semibold text-green-700">
            Curso Extraído: {resultado.nomeCurso || 'Nome não identificado'}
          </h2>

          <div className="space-y-3">
            <h3 className="font-medium text-lg">Unidades Curriculares ({resultado.unidadesCurriculares?.length || 0}):</h3>
            {resultado.unidadesCurriculares?.map((uc, idx) => (
              <div key={idx} className="bg-white p-3 rounded border text-sm space-y-1">
                <p className="font-bold text-gray-800">{uc.nomeUc} {uc.cargaHoraria && `(${uc.cargaHoraria})`}</p>
                {uc.capacidades?.length > 0 && (
                  <p><span className="font-semibold">Capacidades:</span> {uc.capacidades.join(', ')}</p>
                )}
                {uc.conhecimentos?.length > 0 && (
                  <p><span className="font-semibold">Conhecimentos:</span> {uc.conhecimentos.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
