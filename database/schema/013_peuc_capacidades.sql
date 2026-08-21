create table peuc_capacidades (
    id uuid primary key,
    peuc_id uuid references peucs(id) on delete cascade,
    capacidade_id uuid references capacidades(id),
    created_at timestamp default now()
);
