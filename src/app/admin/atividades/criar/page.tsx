'use client'

import { useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../../../components/dashboard/Sidebar'
import { withAuth } from '../../../../lib/auth';

const FormAtividade = () => {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [usuarioId, setUsuarioId] = useState<string>('') 
  const [usuarioBusca, setUsuarioBusca] = useState<string>('') 
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<any[]>([]) 
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [startDate, setStartDate] = useState<string>('') 
  const [endDate, setEndDate] = useState<string>('') 
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState<{ [key: string]: boolean }>({}); // Para controlar o foco de cada campo
  const router = useRouter()

  const getJwtToken = () => {
    const jwt = localStorage.getItem('token')
    return jwt ? jwt : null
  }

  const handleUpload = async (file: File, userId: string) => {
    if (!file) return null

    const sanitizedMonth = new Date().toLocaleString('default', { month: 'long' }).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const filePath = `${userId}/${new Date().getFullYear()}/${sanitizedMonth}/${new Date().getDate()}/${file.name}`

    const { data, error } = await supabase.storage
      .from('atividades-enviadas')
      .upload(filePath, file, { cacheControl: '3600', upsert: true })

    if (error) {
      setUploadError(error.message)
      return null
    }

    return data?.path
  }

  const buscarUsuarios = async (name: string) => {
    if (name.trim() === '') {
      setUsuariosEncontrados([])
      return
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('name', `%${name}%`)

    if (error) {
      console.error('Erro ao buscar usuários:', error.message)
      return
    }

    setUsuariosEncontrados(data || [])
  }

  const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsuarioBusca(e.target.value)
    buscarUsuarios(e.target.value)
  }

  const preencherCampoBusca = (name: string, id: string) => {
    setUsuarioBusca(name)
    setUsuarioId(id)
    setUsuariosEncontrados([])
  }

  const convertToUTCMinus3 = (dateString: string) => {
    const localDate = new Date(dateString)
    localDate.setHours(localDate.getHours() + 0)
    return localDate.toISOString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const jwt = getJwtToken()
    if (!jwt) {
      console.error('Token de autenticação não encontrado.')
      return
    }

    const { data: session, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('Erro ao obter sessão:', sessionError?.message)
      return
    }

    const userIdToSend = usuarioId || ''

    let arquivoCaminho = ''
    if (arquivo) {
      arquivoCaminho = await handleUpload(arquivo, userIdToSend) || ''
    }

    const validStartDate = startDate ? convertToUTCMinus3(startDate) : null
    const validEndDate = endDate ? convertToUTCMinus3(endDate) : null

    const { error } = await supabase
      .from('atividades')
      .insert([{
        titulo,
        descricao,
        arquivo_url: arquivoCaminho,
        user_id: userIdToSend,
        start_date: validStartDate,
        end_date: validEndDate,
        created_at: new Date().toISOString(),
      }])

    if (error) {
      console.error('Erro ao inserir atividade:', error.message)
      return
    }

    console.log('Atividade enviada com sucesso!')
    router.push('/admin/atividades')
  }

  const getInputClass = (value: string | File | null) => {
    return value ? 'border-[#00a830]' : 'border-gray-300'
  }

  const getLabelClass = (value: string | File | null, id: string) => {
    // Verificar se o campo está em foco ou preenchido
    const isFieldFocused = isFocused[id] || false
    return (value || isFieldFocused) ? 'text-[#00a830] top-[-1.1rem] scale-75' : 'text-gray-500 top-1/4 scale-100'
  }

  const handleFocus = (id: string) => {
    setIsFocused(prevState => ({ ...prevState, [id]: true }))
  }

  const handleBlur = (id: string) => {
    setIsFocused(prevState => ({ ...prevState, [id]: false }))
  }

  return (
    <div className="flex overflow-hidden h-screen">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-100 overflow-hidden h-full">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">Criar Atividade</h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-6 relative">
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                onFocus={() => handleFocus('titulo')}
                onBlur={() => handleBlur('titulo')}
                className={`mt-2 block w-full px-3 py-2 focus:outline-none focus:ring-0 focus:border-[#00a830] transition-all duration-300 ease-in-out border-0 border-b-2 ${getInputClass(titulo)}`}
              />
              <label
                htmlFor="titulo"
                className={`absolute left-3 text-sm transition-all duration-300 ease-in-out transform origin-top-left ${getLabelClass(titulo, 'titulo')}`}
              >
                Título
              </label>
            </div>

            <div className="mb-6 relative">
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                onFocus={() => handleFocus('descricao')}
                onBlur={() => handleBlur('descricao')}
                className={`mt-2 block w-full px-3 py-2 focus:outline-none focus:ring-0 focus:border-[#00a830] transition-all duration-300 ease-in-out border-0 border-b-2 ${getInputClass(descricao)}`}
              />
              <label
                htmlFor="descricao"
                className={`absolute left-3 text-sm transition-all duration-300 ease-in-out transform origin-top-left ${getLabelClass(descricao, 'descricao')}`}
              >
                Descrição
              </label>
            </div>

            <div className="mb-6 relative">
              <input
                type="text"
                id="usuarioBusca"
                value={usuarioBusca}
                onChange={handleBuscaChange}
                onFocus={() => handleFocus('usuarioBusca')}
                onBlur={() => handleBlur('usuarioBusca')}
                className={`mt-2 block w-full px-3 py-2 focus:outline-none focus:ring-0 focus:border-[#00a830] transition-all duration-300 ease-in-out border-0 border-b-2 ${getInputClass(usuarioBusca)}`}
              />
              <label
                htmlFor="usuarioBusca"
                className={`absolute left-3 text-sm transition-all duration-300 ease-in-out transform origin-top-left ${getLabelClass(usuarioBusca, 'usuarioBusca')}`}
              >
                Buscar Usuário
              </label>
              {usuarioBusca && usuariosEncontrados.length > 0 && (
                <div className="mt-2 max-w-md">
                  {usuariosEncontrados.map((usuario) => (
                    <span
                      key={usuario.id}
                      onClick={() => preencherCampoBusca(usuario.name, usuario.id)}
                      className="block cursor-pointer p-2 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      {usuario.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6 relative">
              <label htmlFor="startDate" className={`ml-3 text-sm transition-all duration-300 ease-in-out transform origin-top-left ${getLabelClass(startDate, 'startDate')}`}>
                Data de Início
              </label>
              <input
                type="datetime-local"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onFocus={() => handleFocus('startDate')}
                onBlur={() => handleBlur('startDate')}
                className={`mt-2 block w-full px-3 py-2 focus:outline-none focus:ring-0 focus:border-[#00a830] transition-all duration-300 ease-in-out border-0 border-b-2 ${getInputClass(startDate)}`}
              />
            </div>

            <div className="mb-6 relative">
              <label htmlFor="endDate" className={`ml-3 text-sm transition-all duration-300 ease-in-out transform origin-top-left ${getLabelClass(endDate, 'endDate')}`}>
                Data de Término
              </label>
              <input
                type="datetime-local"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onFocus={() => handleFocus('endDate')}
                onBlur={() => handleBlur('endDate')}
                className={`mt-2 block w-full px-3 py-2 focus:outline-none focus:ring-0 focus:border-[#00a830] transition-all duration-300 ease-in-out border-0 border-b-2 ${getInputClass(endDate)}`}
              />
            </div>

            <div className="mb-6">
              <input
                type="file"
                id="file"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                className={`mt-1 block w-full max-w-md text-sm py-2 border-0 border-b-2 transition-all duration-300 ease-in-out ${arquivo ? 'border-[#00a830]' : 'border-gray-300'}`}
              />
            </div>

            {uploadError && <p className="text-red-500">{uploadError}</p>}

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="py-2 px-6 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-300 text-sm"
              >
                Criar Atividade
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default withAuth(FormAtividade);
