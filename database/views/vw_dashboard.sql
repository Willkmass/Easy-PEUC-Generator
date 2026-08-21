create view vw_dashboard as
select
    (select count(*) from cursos) as total_cursos,
    (select count(*) from unidades_curriculares) as total_ucs,
    (select count(*) from peucs) as total_peucs,
    (select count(*) from users) as total_usuarios;
