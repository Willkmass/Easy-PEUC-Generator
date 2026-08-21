create table peuc_recursos (
    id uuid primary key,
    peuc_id uuid references peucs(id) on delete cascade,
    recurso_id uuid references recursos_pedagogicos(id),
    created_at timestamp default now()
);
