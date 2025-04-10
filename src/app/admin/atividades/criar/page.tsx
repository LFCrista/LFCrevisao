'use client'

import { useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '../../../../components/dashboard/Sidebar'
import { withAuth } from '../../../../lib/auth'

const FormAtividade = () => {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [usuarioId, setUsuarioId] = useState<string>('') 
  const [usuarioBusca, setUsuarioBusca] = useState<string>('') 
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<any[]>([]) 
  const [arquivos, setArquivos] = useState<File[]>([]) // Agora armazenamos os arquivos como array
  const [startDate, setStartDate] = useState<string>('') 
  const [endDate, setEndDate] = useState<string>('') 
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState<{ [key: string]: boolean }>({}); // Para controlar o foco de cada campo
  const [fileExistsError, setFileExistsError] = useState<string | null>(null); // Mensagem de erro para arquivo duplicado
  const router = useRouter()

  const getJwtToken = () => {
    const jwt = localStorage.getItem('token')
    return jwt ? jwt : null
  }

  const handleUpload = async (file: File, userId: string, atividade: string) => {
    if (!file) return null
    
    // Buscar o nome do usuário no banco de dados
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single()
  
    if (userError || !userData) {
      setUploadError('Erro ao buscar o nome do usuário.')
      return null
    }
  
    const userName = userData.name
    
    // Obter a data atual para formatar o caminho com ano, mês e dia
    const now = new Date()
    const year = now.getFullYear()  // Ano
    const month = (now.getMonth() + 1).toString().padStart(2, '0')  // Mês com 2 dígitos
    const day = now.getDate().toString().padStart(2, '0')  // Dia com 2 dígitos
  
    // Criar o caminho completo da pasta para a estrutura desejada
    const filePath = `${userName}/${year}/${month}/${day}/${atividade}/`
  
    // Realizar o upload do arquivo para o Supabase
    const { data, error } = await supabase.storage
      .from('atividades-enviadas')
      .upload(filePath + file.name, file, { cacheControl: '3600', upsert: true })
  
    if (error) {
      setUploadError(error.message)
      return null
    }
  
    return filePath  // Retorna apenas o caminho da pasta, sem o nome do arquivo
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

    // Carregar todos os arquivos simultaneamente
    const arquivosCaminho: string[] = await Promise.all(arquivos.map(async (file) => {
      const caminhoArquivo = await handleUpload(file, userIdToSend, titulo)
      return caminhoArquivo || ''
    }))

    const validStartDate = startDate ? convertToUTCMinus3(startDate) : null
    const validEndDate = endDate ? convertToUTCMinus3(endDate) : null

    // Atualiza a inserção no banco de dados, agora salvando apenas o caminho da pasta
    const { error } = await supabase
      .from('atividades')
      .insert([{
        titulo,
        descricao,
        arquivo_url: arquivosCaminho[0],  // Salvando apenas o caminho da pasta
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
    const isFieldFocused = isFocused[id] || false
    return (value || isFieldFocused) ? 'text-[#00a830] top-[-1.1rem] scale-75' : 'text-gray-500 top-1/4 scale-100'
  }

  const handleFocus = (id: string) => {
    setIsFocused(prevState => ({ ...prevState, [id]: true }))
  }

  const handleBlur = (id: string) => {
    setIsFocused(prevState => ({ ...prevState, [id]: false }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Adicionando os novos arquivos ao estado existente sem sobrescrever
      const newFiles = Array.from(files);

      // Verificar se algum dos novos arquivos já está na lista
      const duplicateFile = newFiles.find(file => arquivos.some(existingFile => existingFile.name === file.name));
      if (duplicateFile) {
        setFileExistsError(`O arquivo "${duplicateFile.name}" já foi carregado.`);
      } else {
        setArquivos((prevFiles) => [...prevFiles, ...newFiles]);
        setFileExistsError(null); // Limpar a mensagem de erro caso não haja duplicados
      }
    }
  }

  const removeFile = (fileName: string) => {
    setArquivos((prevArquivos) => prevArquivos.filter(file => file.name !== fileName));

    // Resetando o input de arquivos para permitir adicionar novamente o arquivo removido
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Limpa o campo de arquivo
    }
  }

  return (
    <div className="flex overflow-hidden h-screen">
      {/* Sidebar fixa */}
      <div className="w-64 h-full fixed top-0 left-0 z-10">
        <Sidebar />
      </div>

      {/* Conteúdo principal com rolagem liberada */}
      <div className="flex-1 p-6 bg-gray-100 overflow-auto h-full ml-64">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">Criar Atividade</h1>

          <form onSubmit={handleSubmit}>
            {/* Título */}
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

            {/* Descrição */}
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

            {/* Buscar Usuário */}
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

            {/* Data de Início */}
            <div className="mb-6 relative">
              <label htmlFor="startDate" className={`ml-3 text-sm transition-all duration-300 ease-in-out transform origin-top-left ${getLabelClass(startDate, 'startDate')}`} >
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

            {/* Data de Fim */}
            <div className="mb-6 relative">
              <label htmlFor="endDate" className={`ml-3 text-sm transition-all duration-300 ease-in-out transform origin-top-left ${getLabelClass(endDate, 'endDate')}`} >
                Data de Fim
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

            {/* Botão de Upload */}
            <div className="mb-6 relative">
              {/* Mostrar a mensagem de erro se houver arquivos duplicados */}
              {fileExistsError && (
                <div className="text-red-500 mb-2">
                  {fileExistsError}
                </div>
              )}
              <button
                type="button"
                onClick={() => document.getElementById('fileInput')?.click()}
                className="mt-2 block w-full px-3 py-2 bg-[#00a830] text-white rounded-lg focus:outline-none focus:ring-0"
              >
                Carregar Arquivos
              </button>
              <input
                type="file"
                id="fileInput"
                accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="mt-2">
                {arquivos.map((file, index) => (
                  <div key={index} className="flex items-center">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(file.name)}
                      className="ml-2 text-red-500"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {uploadError && <div className="text-red-500 mb-4">{uploadError}</div>}

            <button
              type="submit"
              className="px-6 py-2 bg-[#00a830] text-white rounded-lg hover:bg-[#009624]">
              Criar Atividade
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default withAuth(FormAtividade)
