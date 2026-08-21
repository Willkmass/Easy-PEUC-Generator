create table criterios_avaliacao (
    id uuid primary key,
    descricao text not null,
    created_at timestamp default now()
);
