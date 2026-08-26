import express from 'express';
import { processarPdfEmLotes } from '../services/pdfProcessor.js';

const router = express.Router();

router.post('/ingestao-pdf', async (req, res) => {
  try {
    const { caminhoArquivo } = req.body; 
    
    if (!caminhoArquivo) {
      return res.status(400).json({ error: "Caminho do arquivo não informado." });
    }

    const resultado = await processarPdfEmLotes(caminhoArquivo, 10);
    return res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
