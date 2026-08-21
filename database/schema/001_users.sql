create table users (
    id uuid primary key,
    nome text not null,
    email text unique not null,
    perfil text not null,
    created_at timestamp default now()
);
