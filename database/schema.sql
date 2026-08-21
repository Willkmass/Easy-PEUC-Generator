-- Habilita extensão para geração de UUID
create extension if not exists "uuid-ossp";

-- 1. USUÁRIOS
create table users (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text unique not null,
    perfil text not null check (perfil in ('admin', 'coordenador', 'docente', 'consulta')),
    created_at timestamp with time zone default now()
);

-- 2. ESTRUTURA DO PCA (Cursos e UCs)
create table cursos (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    modalidade text not null,
    eixo_tecnologico text,
    carga_horaria integer not null,
    created_at timestamp with time zone default now()
);

create table unidades_curriculares (
    id uuid primary key default gen_random_uuid(),
    curso_id uuid not null references cursos(id) on delete cascade,
    codigo text,
    nome text not null,
    carga_horaria integer not null,
    objetivo text,
    versao integer default 1,
    created_at timestamp with time zone default now()
);

create table capacidades (
    id uuid primary key default gen_random_uuid(),
    unidade_curricular_id uuid not null references unidades_curriculares(id) on delete cascade,
    tipo text not null check (tipo in ('basica', 'tecnica', 'socioemocional', 'gestao')),
    descricao text not null,
    created_at timestamp with time zone default now()
);

create table conhecimentos (
    id uuid primary key default gen_random_uuid(),
    unidade_curricular_id uuid not null references unidades_curriculares(id) on delete cascade,
    descricao text not null,
    created_at timestamp with time zone default now()
);

-- 3. TABELAS DE APOIO E AUXILIARES
create table metodologias (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    descricao text,
    created_at timestamp with time zone default now()
);

create table criterios_avaliacao (
    id uuid primary key default gen_random_uuid(),
    descricao text not null,
    created_at timestamp with time zone default now()
);

create table recursos_pedagogicos (
    id uuid primary key default gen_random_uuid(),
    descricao text not null,
    created_at timestamp with time zone default now()
);

create table instrumentos_avaliacao (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    descricao text,
    created_at timestamp with time zone default now()
);

-- 4. ESTRUTURA PRINCIPAL DA PEUC
create table peucs (
    id uuid primary key default gen_random_uuid(),
    curso_id uuid not null references cursos(id),
    unidade_curricular_id uuid not null references unidades_curriculares(id),
    docente_id uuid not null references users(id),
    tipo_situacao_aprendizagem text not null,
    integra_outra_uc boolean default false,
    contextualizacao text,
    desafio text,
    resultados_esperados text,
    status text default 'rascunho' check (status in ('rascunho', 'em_revisao', 'aprovado')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Relacionamentos N:N da PEUC
create table peuc_capacidades (
    peuc_id uuid references peucs(id) on delete cascade,
    capacidade_id uuid references capacidades(id) on delete cascade,
    primary key (peuc_id, capacidade_id)
);

create table peuc_conhecimentos (
    peuc_id uuid references peucs(id) on delete cascade,
    conhecimento_id uuid references conhecimentos(id) on delete cascade,
    primary key (peuc_id, conhecimento_id)
);

-- 5. CRONOGRAMA / PLANO DE AULA
create table planos_aula (
    id uuid primary key default gen_random_uuid(),
    peuc_id uuid not null references peucs(id) on delete cascade,
    numero_aulas integer not null,
    estrategia_ensino text not null,
    ambientes_recursos text,
    created_at timestamp with time zone default now()
);

-- Vinculações Múltiplas do Plano de Aula
create table plano_aula_capacidades (
    plano_aula_id uuid references planos_aula(id) on delete cascade,
    capacidade_id uuid references capacidades(id) on delete cascade,
    primary key (plano_aula_id, capacidade_id)
);

create table plano_aula_conhecimentos (
    plano_aula_id uuid references planos_aula(id) on delete cascade,
    conhecimento_id uuid references conhecimentos(id) on delete cascade,
    primary key (plano_aula_id, conhecimento_id)
);

create table plano_aula_criterios (
    plano_aula_id uuid references planos_aula(id) on delete cascade,
    criterio_id uuid references criterios_avaliacao(id) on delete cascade,
    primary key (plano_aula_id, criterio_id)
);

create table plano_aula_instrumentos (
    plano_aula_id uuid references planos_aula(id) on delete cascade,
    instrumento_id uuid references instrumentos_avaliacao(id) on delete cascade,
    primary key (plano_aula_id, instrumento_id)
);

-- 6. HISTÓRICO E AUDITORIA
create table historico_peuc (
    id uuid primary key default gen_random_uuid(),
    peuc_id uuid references peucs(id) on delete cascade,
    usuario_id uuid references users(id),
    acao text not null,
    descricao text,
    created_at timestamp with time zone default now()
);

create table importacoes (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid references users(id),
    arquivo text,
    tipo text,
    registros_importados integer default 0,
    created_at timestamp with time zone default now()
);
