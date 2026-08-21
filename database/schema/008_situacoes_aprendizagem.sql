create table situacoes_aprendizagem (
    id uuid primary key,
    titulo text not null,
    contextualizacao text,
    desafio text,
    resultado_esperado text,
    created_at timestamp default now()
);
