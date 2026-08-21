create table peuc_metodologias (
    id uuid primary key,
    peuc_id uuid references peucs(id) on delete cascade,
    metodologia_id uuid references metodologias(id),
    created_at timestamp default now()
);
