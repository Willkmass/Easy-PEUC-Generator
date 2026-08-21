create table importacoes (
    id uuid primary key,
    usuario_id uuid references users(id),
    arquivo text,
    tipo text,
    registros_importados integer default 0,
    created_at timestamp default now()
);
