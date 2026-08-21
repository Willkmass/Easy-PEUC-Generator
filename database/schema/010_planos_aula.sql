create table planos_aula (
    id uuid primary key,
    peuc_id uuid references peucs(id) on delete cascade,
    numero_aulas integer not null,
    capacidade_id uuid references capacidades(id),
    conhecimento_id uuid references conhecimentos(id),
    criterio_id uuid references criterios_avaliacao(id),
    created_at timestamp default now()
);
