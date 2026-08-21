create view vw_peuc_completa as
select
    p.id,
    c.nome as curso,
    uc.nome as unidade_curricular,
    p.status,
    p.versao,
    p.created_at
from peucs p
join cursos c on c.id = p.curso_id
join unidades_curriculares uc on uc.id = p.uc_id;
