create table metodologias (
    id uuid primary key,
    nome text not null,
    descricao text,
    created_at timestamp default now()
);
