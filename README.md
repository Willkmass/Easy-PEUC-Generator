# 🛠️ Easy PEUC Generator (SENAI-PR)

Sistema automatizado para extração de dados pedagógicos de **Planos de Curso (PCA)** em PDF via **Gemini 2.5 Flash** e elaboração acelerada de **Planos de Ensino por Unidade Curricular (PEUC)**.

---

## 🚀 Tech Stack

* **Framework:** Next.js (App Router, TypeScript)
* **Estilização:** Tailwind CSS
* **Banco de Dados:** Supabase (PostgreSQL)
* **Inteligência Artificial:** Gemini 2.5 Flash API
* **Processamento de PDF:** PDF.js / pdf-lib

---

## 📋 Variáveis de Ambiente Necessárias

Para a aplicação funcionar na Vercel ou ambiente local, configure as seguintes variáveis no painel da Vercel (`Settings` -> `Environment Variables`):

| Variável | Descrição |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do seu projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública/anônima do Supabase |
| `GEMINI_API_KEY` | Chave de API do Google Gemini |

---

## 📌 Fluxo da Aplicação

1. **Ingestão Oficial (`/importar-pca`):** O usuário faz upload do PDF do PCA. A IA lê e separa rigidamente a **Categoria** (ex: *Aprendizagem Industrial*) do **Nome do Curso** (ex: *Auxiliar de Linha de Produção*) e salva as Unidades Curriculares no Supabase.
2. **Consulta do Acervo (`/cursos`):** Exibe todos os cursos cadastrados via PCA e expansão de suas UCs com Capacidades e Conhecimentos.
3. **Elaboração de PEUC (`/peuc/criar`):** O docente vincula as UCs existentes à Situação de Aprendizagem (Projeto, Estudo de Caso, etc.).
4. **Gestão de PEUCs (`/peuc`):** Listagem e consulta detalhada dos planos de ensino gerados.

---

## 🗄️ Estrutura do Banco de Dados (Supabase SQL)

As tabelas devem ser criadas via Editor SQL no Supabase:

* `cursos`: Registro de cursos e modalidades.
* `unidades_curriculares`: Disciplinas, cargas horárias, capacidades e conhecimentos extraídos dos PCAs.
* `peucs`: Planos de ensino finalizados e vinculados às UCs.

---
*Build Trigger: Atualizado para reprocessar dependências no pipeline da Vercel.*
