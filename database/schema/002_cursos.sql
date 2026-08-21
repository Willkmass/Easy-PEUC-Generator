create table cursos (
    id uuid primary key,
    nome text not null,
    modalidade text,
    eixo_tecnologico text,
    carga_horaria integer,
    created_at timestamp default now()
);
