create table instrumentos_avaliacao (
    id uuid primary key,
    nome text not null,
    descricao text,
    created_at timestamp default now()
);
