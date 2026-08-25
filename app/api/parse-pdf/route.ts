import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { images } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Nenhuma imagem foi fornecida' }, { status: 400 });
    }

    const systemPrompt = `Você é um extrator de dados de Planos de Curso (PCA) do SENAI-PR.
Analise visualmente as imagens fornecidas das páginas do documento e extraia os dados com EXTREMA PRECISÃO.

REGRAS DE SEPARAÇÃO:
1. "categoria": Identifique APENAS o TIPO/MODALIDADE da oferta (ex: "Aprendizagem Industrial", "Habilitação Técnica", "Aperfeiçoamento Profissional"). NUNCA insira o nome do curso aqui.
2. "curso": Identifique APENAS o NOME ESPECÍFICO DO CURSO/OCUPAÇÃO (ex: "Auxiliar de Linha de Produção", "Assistente Administrativo", "Eletricista Industrial"). NUNCA insira termos como "Aprendizagem Industrial" neste campo.
3. "carga_horaria_total": Carga horária total indicada no documento (ex: "400h").
4. "unidades_curriculares": Extraia apenas disciplinas/módulos reais com carga horária.
   - REGRA ABSOLUTA: Endereços, telefones, CNPJ, bairros, cidades e CEP NUNCA SÃO unidades curriculares. Ignore-os completamente.
5. Para cada UC:
   - "capacidades": Apenas frases iniciando com verbos de ação no infinitivo.
   - "conhecimentos": Tópicos programáticos numerados ou em lista.

Responda EXCLUSIVAMENTE em formato JSON com esta estrutura exata:
{
  "categoria": "Aprendizagem Industrial",
  "curso": "Auxiliar de Linha de Produção",
  "carga_horaria_total": "400h",
  "unidades_curriculares": [
    {
      "numero": 1,
      "nome": "Nome oficial da UC",
      "carga_horaria": 40,
      "capacidades": ["Capacidade 1", "Capacidade 2"],
      "conhecimentos": ["Conhecimento 1", "Conhecimento 2"]
    }
  ]
}`;

    // Monta o payload com o texto das instruções + array das imagens em base64
    const parts: any[] = [{ text: systemPrompt }];

    images.forEach((base64Image: string) => {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Image
        }
      });
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      }
    );

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Resposta inválida do modelo Gemini');
    }

    const rawJson = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(rawJson);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Erro na API parse-pdf:', error);
    return NextResponse.json({ error: error.message || 'Falha ao processar imagens' }, { status: 500 });
  }
}
