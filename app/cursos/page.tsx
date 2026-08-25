'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Curso {
  id: string
  nome: string
  modalidade: string
  eixo_tecnologico: string
  carga_horaria: number
  created_at?: string
}

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Estados do Formulário
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState<string>('')
  const [modalidade, setModalidade] = useState<string>('')
  const [eixoTecnologico, setEixoTecnologico] = useState<string>('')
  const [cargaHoraria, setCargaHoraria] = useState<string>('')

  useEffect(() => {
    fetchCursos()
  }, [])

  async function fetchCursos() {
    try {
      setLoading(true)
      setErrorMsg(null)
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setCursos(data as Curso[])
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar a lista de cursos.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setEditingId(null)
    setNome('')
    setModalidade('')
    setEixoTecnologico('')
    setCargaHoraria('')
  }

  function handleEdit(curso: Curso) {
    setEditingId(curso.id)
    setNome(curso.nome)
    setModalidade(curso.modalidade)
    setEixoTecnologico(curso.eixo_tecnologico)
    setCargaHoraria(curso.carga_horaria.toString())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome || !modalidade || !eixoTecnologico || !cargaHoraria) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    try {
      setSaving(true)
      setErrorMsg(null)

      const payload = {
        nome,
        modalidade,
        eixo_tecnologico: eixoTecnologico,
        carga_horaria: parseInt(cargaHoraria, 10),
      }

      if (editingId) {
        const { error } = await supabase
          .from('cursos')
          .update(payload)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('cursos')
          .insert([payload])

        if (error) throw error
      }

      resetForm()
      await fetchCursos()
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar o curso.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return

    try {
      setLoading(true)
      setErrorMsg(null)

      const { error } = await supabase
        .from('cursos')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchCursos()
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao excluir o curso. Verifique dependências ou permissões RLS.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestão de Cursos</h1>
            <p className="text-sm text-gray-500">Cadastre e gerencie os cursos institucionais do SENAI</p>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 text-sm flex justify-between items-center">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="font-bold ml-4">✕</button>
          </div>
        )}

        {/* Formulário de Cadastro / Edição */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {editingId ? 'Editar Curso' : 'Novo Curso'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Curso</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Técnico em Desenvolvimento de Sistemas"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
              <input
                type="text"
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value)}
                placeholder="Ex: Habilitação Técnica / Qualificação"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eixo Tecnológico</label>
              <input
                type="text"
                value={eixoTecnologico}
                onChange={(e) => setEixoTecnologico(e.target.value)}
                placeholder="Ex: Informação e Comunicação"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária Total (Horas)</label>
              <input
                type="number"
                value={cargaHoraria}
                onChange={(e) => setCargaHoraria(e.target.value)}
                placeholder="Ex: 1200"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                required
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3 mt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancelar Edição
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editingId ? 'Atualizar Curso' : 'Cadastrar Curso'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabela de Listagem */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">Cursos Cadastrados</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Carregando cursos...</div>
          ) : cursos.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhum curso cadastrado até o momento.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                    <th className="py-3 px-6">Nome</th>
                    <th className="py-3 px-6">Modalidade</th>
                    <th className="py-3 px-6">Eixo Tecnológico</th>
                    <th className="py-3 px-6">Carga Horária</th>
                    <th className="py-3 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                  {cursos.map((curso) => (
                    <tr key={curso.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6 font-medium text-gray-900">{curso.nome}</td>
                      <td className="py-3 px-6">{curso.modalidade}</td>
                      <td className="py-3 px-6">{curso.eixo_tecnologico}</td>
                      <td className="py-3 px-6">{curso.carga_horaria}h</td>
                      <td className="py-3 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(curso)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(curso.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
