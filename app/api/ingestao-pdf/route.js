import { NextResponse } from 'next/server';
import { processarPdfsMultiplos } from '@/app/services/pdfProcessor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('arquivos');

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo recebido' }, { status: 400 });
    }

    const buffers = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      buffers.push({
        buffer,
        mimeType: file.type || 'application/pdf'
      });
    }

    const resultado = await processarPdfsMultiplos(buffers);

    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    console.error('Erro na API de Ingestão:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
