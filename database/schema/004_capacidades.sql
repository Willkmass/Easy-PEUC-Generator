create table capacidades (
    id uuid primary key,
    tipo text not null,
    descricao text not null,
    created_at timestamp default now()
);
