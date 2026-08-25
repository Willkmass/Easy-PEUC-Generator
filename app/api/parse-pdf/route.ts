import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo PDF não fornecido' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Pdf = buffer.toString('base64');

    const systemPrompt = `Você é um extrator de dados especialista nos documentos do SENAI-PR (Plano de Curso / PCA).
Analise visualmente a primeira página e a estrutura de tabelas do PDF para preencher os dados com EXTREMA precisÃO.

REGRAS DE CLASSIFICAÇÃO:
1. "categoria": Identifique o tipo de oferta de ensino (ex: "Aprendizagem Industrial", "Habilitação Técnica", "Aperfeiçoamento Professional", "Qualificação Profissional"). NÃO COLOQUE O NOME DO CURSO AQUI.
2. "curso": Extraia o NOME ESPECÍFICO E REAL DO CURSO (ex: "Auxiliar de Linha de Produção", "Assistente Administrativo", "Eletricista Industrial"). NUNCA insira termos genéricos como "Aprendizagem Industrial" neste campo.
3. "carga_horaria_total": Carga horária total indicada no documento (ex: "400h", "800h").
4. "unidades_curriculares": Extraia APENAS disciplinas/módulos de ensino reais.
   - REGRA ABSOLUTA: Descarte endereços, CNPJ, cidades, CEP, telefones e rodapés institucionais. Eles NÃO são unidades curriculares.
5. Para cada UC extraída:
   - "capacidades": Apenas itens com verbos de ação/infinitivo.
   - "conhecimentos": Conteúdos e tópicos programáticos.

Responda EXCLUSIVAMENTE em formato JSON com esta estrutura:
{
  "categoria": "Aprendizagem Industrial",
  "curso": "Auxiliar de Linha de Produção",
  "carga_horaria_total": "400h",
  "unidades_curriculares": [
    {
      "numero": 1,
      "nome": "Nome da UC",
      "carga_horaria": 40,
      "capacidades": ["Capacidade 1", "Capacidade 2"],
      "conhecimentos": ["Conhecimento 1", "Conhecimento 2"]
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Pdf
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      }
    );

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Resposta inválida do modelo de IA');
    }

    const rawJson = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(rawJson);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Erro no processamento do PDF via IA:', error);
    return NextResponse.json({ error: 'Falha ao processar o PDF com a IA' }, { status: 500 });
  }
}
