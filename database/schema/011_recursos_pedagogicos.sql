create table recursos_pedagogicos (
    id uuid primary key,
    descricao text not null,
    created_at timestamp default now()
);
