create table conhecimentos (
    id uuid primary key,
    descricao text not null,
    created_at timestamp default now()
);
