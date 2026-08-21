create table peuc_criterios (
    id uuid primary key,
    peuc_id uuid references peucs(id) on delete cascade,
    criterio_id uuid references criterios_avaliacao(id),
    created_at timestamp default now()
);
