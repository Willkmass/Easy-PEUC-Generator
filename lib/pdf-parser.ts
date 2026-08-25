'use client';

import { useState } from 'react';
import { extractTextFromPDF } from '@/lib/pdf-parser';

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Executa a função criada no src/lib/pdf-parser.ts
      const textoExtraido = await extractTextFromPDF(file);
      console.log('Texto limpo e extraído:', textoExtraido);
      
      // Aqui você enviará o textoExtraido para a sua API / IA
    } catch (error) {
      console.error('Erro ao ler PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <input 
        type="file" 
        accept="application/pdf" 
        onChange={handleFileUpload} 
        disabled={loading}
      />
      {loading && <p>Lendo e processando o PDF...</p>}
    </div>
  );
}
