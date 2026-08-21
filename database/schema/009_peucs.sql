create table peucs (
    id uuid primary key,
    curso_id uuid references cursos(id),
    uc_id uuid references unidades_curriculares(id),
    autor_id uuid references users(id),
    status text default 'rascunho',
    versao integer default 1,
    created_at timestamp default now()
);
