import { NextResponse } from 'next/server';
import { processarPdfsMultiplos } from '@/app/services/pdfProcessor';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('arquivos');

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo recebido' }, { status: 400 });
    }

    const caminhosTemporarios = [];

    // Salva os arquivos recebidos temporariamente na máquina para a Gemini API ler
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const tempPath = path.join(os.tmpdir(), `${Date.now()}_${file.name}`);
      await fs.promises.writeFile(tempPath, buffer);
      caminhosTemporarios.push(tempPath);
    }

    // Processa os PDFs usando a biblioteca do Gemini
    const resultado = await processarPdfsMultiplos(caminhosTemporarios);

    // Limpa os arquivos temporários do servidor
    for (const tempPath of caminhosTemporarios) {
      try { await fs.promises.unlink(tempPath); } catch (_) {}
    }

    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    console.error('Erro na API de Ingestão:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
