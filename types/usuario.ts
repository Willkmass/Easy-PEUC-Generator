export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: "admin" | "coordenador" | "docente" | "consulta";
  createdAt?: string;
}
