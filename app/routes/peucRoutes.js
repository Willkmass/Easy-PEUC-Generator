import express from 'express';
import multer from 'multer';
import { processarPdfsMultiplos } from '../services/pdfProcessor.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Aceita até 5 arquivos no mesmo envio
router.post('/ingestao-pdf', upload.array('arquivos', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const caminhos = req.files.map(file => file.path);
    const resultado = await processarPdfsMultiplos(caminhos);

    return res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
