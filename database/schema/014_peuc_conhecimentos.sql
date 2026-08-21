create table peuc_conhecimentos (
    id uuid primary key,
    peuc_id uuid references peucs(id) on delete cascade,
    conhecimento_id uuid references conhecimentos(id),
    created_at timestamp default now()
);
