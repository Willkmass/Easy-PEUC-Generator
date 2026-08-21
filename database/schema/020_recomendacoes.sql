create table recomendacoes (
    id uuid primary key,
    origem_tipo text not null,
    origem_id uuid not null,
    destino_tipo text not null,
    destino_id uuid not null,
    frequencia integer default 1,
    created_at timestamp default now()
);
