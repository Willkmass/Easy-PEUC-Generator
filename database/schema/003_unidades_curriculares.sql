create table unidades_curriculares (
    id uuid primary key,
    curso_id uuid references cursos(id),
    codigo text,
    nome text not null,
    carga_horaria integer,
    objetivo text,
    versao integer default 1,
    created_at timestamp default now()
);
