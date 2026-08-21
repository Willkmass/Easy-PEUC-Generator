create table historico_peuc (
    id uuid primary key,
    peuc_id uuid references peucs(id) on delete cascade,
    usuario_id uuid references users(id),
    acao text not null,
    descricao text,
    created_at timestamp default now()
);
