'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

const AtividadePage = () => {
  const [atividade, setAtividade] = useState<any>(null)
  const [feitoArquivos, setFeitoArquivos] = useState<File[]>([])
  const [user, setUser] = useState<any>(null)
  const [nomeUsuario, setNomeUsuario] = useState<string>('')
  const [statusAtividade, setStatusAtividade] = useState<string>('') 
  const [feitoUrls, setFeitoUrls] = useState<string[]>([])
  const [arquivosNaPasta, setArquivosNaPasta] = useState<any[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [observacaoEnvio, setObservacaoEnvio] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const params = useParams()

  

  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) console.error('Erro ao obter sessão:', error.message)
      else setUser(session?.user || null)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (!params.id || !user) return

    const fetchAtividadeData = async () => {
      const { data, error } = await supabase
        .from('atividades')
        .select('id, titulo, descricao, user_id, arquivo_url, feito_url, start_date, end_date, concluida, obs_envio')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Erro ao buscar dados da atividade:', error.message)
        return
      }

      if (data) {

        setAtividade(data)
        setObservacaoEnvio(data.obs_envio ?? '')

        const currentDate = new Date()
        const endDate = new Date(data.end_date)
        if (currentDate > endDate && data.concluida) setStatusAtividade('Finalizada')
        else if (data.concluida) setStatusAtividade('Concluída')
        else if (currentDate > endDate) setStatusAtividade('Atrasada')
        else setStatusAtividade('Pendente')

        if (data.feito_url) {
          const folderPath = data.feito_url
          setFeitoUrls([folderPath])
          fetchArquivosNaPasta(folderPath)
        }

        fetchNomeUsuario(data.user_id)
      }
    }

    fetchAtividadeData()
  }, [params.id, user])

  

  const fetchNomeUsuario = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar nome do usuário:', error.message)
    } else {
      setNomeUsuario(data?.name || '')
    }
  }

  const handleDownloadArquivosEnviados = async () => {
    if (!atividade?.arquivo_url) {
      console.error('A URL dos arquivos enviados está ausente.')
      return
    }
  
    const folderPath = atividade.arquivo_url
    const zip = new JSZip()
  
    try {
      const { data: arquivos, error: listError } = await supabase.storage
        .from('atividades-enviadas')
        .list(folderPath)
  
      if (listError || !arquivos || arquivos.length === 0) {
        console.error('Erro ao listar arquivos enviados:', listError?.message)
        alert('Nenhum arquivo encontrado para baixar.')
        return
      }
  
      for (const file of arquivos) {
        const filePath = `${folderPath}/${file.name}`
        const { data: fileData, error } = await supabase.storage
          .from('atividades-enviadas')
          .download(filePath)
  
        if (error) {
          console.error(`Erro ao baixar ${file.name}:`, error.message)
          continue
        }
  
        zip.file(file.name, fileData)
      }
  
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, `arquivos-enviados-${atividade.titulo}.zip`)
    } catch (error: any) {
      console.error('Erro ao baixar arquivos enviados:', error.message || error)
      alert('Erro ao baixar arquivos enviados. Tente novamente.')
    }
  }
  

  const fetchArquivosNaPasta = async (folderPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('atividades-recebidas')
        .list(folderPath, { limit: 100 })

      if (error) {
        console.error('Erro ao listar arquivos:', error.message)
        return
      }

      if (data?.length) setArquivosNaPasta(data)
    } catch (error: any) {
      console.error('Erro inesperado ao listar arquivos:', error.message || error)
    }
  }

  const handleDownload = async (fileName: string) => {
    if (!fileName) return

    try {
      const folderPath = feitoUrls[0]
      const filePath = `${folderPath}/${fileName}`

      const { data: fileData, error } = await supabase.storage
        .from('atividades-recebidas')
        .download(filePath)

      if (error) {
        console.error('Erro ao fazer download do arquivo:', error.message)
        return
      }

      const fileBlob = new Blob([fileData], { type: 'application/octet-stream' })
      const fileUrl = URL.createObjectURL(fileBlob)
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      console.error('Erro inesperado ao fazer o download:', error.message || error)
    }
  }

  const handleRemove = async (fileName: string) => {
    if (!fileName) return

    const confirmRemove = window.confirm('Você tem certeza que deseja remover este arquivo?')
    if (!confirmRemove) return

    try {
      const folderPath = feitoUrls[0]
      const filePath = `${folderPath}/${fileName}`

      const { error } = await supabase.storage
        .from('atividades-recebidas')
        .remove([filePath])

      if (error) {
        console.error('Erro ao remover o arquivo:', error.message)
        return
      }

      setArquivosNaPasta(arquivosNaPasta.filter(file => file.name !== fileName))
      alert('Arquivo removido com sucesso!')

      // Atualizar a lista de arquivos na pasta
      fetchArquivosNaPasta(folderPath)

    } catch (error: any) {
      console.error('Erro inesperado ao remover o arquivo:', error.message || error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files)
      const duplicates = newFiles.filter(newFile =>
        feitoArquivos.some(existing => existing.name === newFile.name)
      )

      if (duplicates.length > 0) {
        setFileError(`O arquivo "${duplicates[0].name}" já foi adicionado.`)
        setTimeout(() => setFileError(null), 4000)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      setFeitoArquivos(prev => [...prev, ...newFiles])
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const sanitizePathComponent = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^\w\s.-]/g, '')       // permite letras, números, hífen, ponto e espaço
      .trim()
      .replace(/\s+/g, '-')            // substitui espaços por hífens
      .toLowerCase()
  }

  
  
  const handleSubmit = async () => {
    if (feitoArquivos.length === 0 && feitoUrls.length === 0) {
      console.error('Você precisa anexar pelo menos um arquivo no primeiro envio.')
      return
    }

    if (feitoArquivos.length === 0 && feitoUrls.length > 0) {
      // Só atualizar a observação
      const { error: updateError } = await supabase
        .from('atividades')
        .update({ obs_envio: observacaoEnvio })
        .eq('id', params.id)
    
      if (updateError) {
        console.error('Erro ao atualizar a observação:', updateError.message)
      } else {
        alert('Observação atualizada com sucesso!')
      }
    
      return
    }
    
    
  
    try {
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
      const day = currentDate.getDate().toString().padStart(2, '0')
  
      const safeTitle = sanitizePathComponent(atividade?.titulo || 'atividade')
      const safeUser = sanitizePathComponent(nomeUsuario || 'usuario')
      const baseFolderPath = `${safeUser}/${year}/${month}/${day}/${safeTitle}`
  
      for (const file of feitoArquivos) {
        const sanitizedName = sanitizePathComponent(file.name) // limpa o nome original
        const fullPath = `${baseFolderPath}/${sanitizedName}`
  
        const existingFile = arquivosNaPasta.find(f => f.name === sanitizedName)
  
        if (existingFile) {
          const userConfirmed = window.confirm(`O arquivo "${sanitizedName}" já existe. Deseja atualizar?`)
          if (userConfirmed) {
            const { error: removeError } = await supabase.storage
              .from('atividades-recebidas')
              .remove([fullPath])
  
            if (removeError) {
              console.error('Erro ao remover o arquivo existente:', removeError.message)
              return
            }
          } else {
            continue
          }
        }
  
        const { error: uploadError } = await supabase.storage
          .from('atividades-recebidas')
          .upload(fullPath, file)
  
        if (uploadError) {
          console.error('Erro ao fazer upload do arquivo:', uploadError.message)
          return
        }
      }
  
      const { error: updateError } = await supabase
  .from('atividades')
  .update({
    feito_url: baseFolderPath,
    concluida: true,
    entrega_date: currentDate.toISOString(),
    obs_envio: observacaoEnvio
  })
  .eq('id', params.id)

  
      if (updateError) {
        console.error('Erro ao atualizar a atividade:', updateError.message)
      } else {
        alert('Atividade enviada com sucesso!')
        setFeitoUrls([baseFolderPath])
        setFeitoArquivos([])
        setStatusAtividade('Concluída')
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchArquivosNaPasta(baseFolderPath)
      }
    } catch (error: any) {
      console.error('Erro inesperado ao enviar a atividade:', error.message || error)
    }
  }
  
  

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-6">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">Detalhes da Atividade</h2>

        {atividade ? (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">{atividade.titulo}</h3>
            <p className="text-gray-600 whitespace-pre-wrap">
              <strong>Descrição:</strong> <br />{atividade.descricao}
            </p>
            <p className="text-gray-600">
              <strong>Data de Início:</strong> {atividade.start_date ? new Date(atividade.start_date).toLocaleString('pt-BR') : 'N/A'}
            </p>
            <p className="text-gray-600">
              <strong>Data de Término:</strong> {atividade.end_date ? new Date(atividade.end_date).toLocaleString('pt-BR') : 'N/A'}
            </p>
            <p className="text-gray-600">
              <strong>Status:</strong> {statusAtividade}
            </p>
          </div>
        ) : (
          <div>Carregando...</div>
        )}

<textarea
  value={observacaoEnvio}
  onChange={(e) => setObservacaoEnvio(e.target.value)}
  placeholder="Digite uma observação sobre o envio (opcional)..."
  className="w-full mt-4 border p-2 rounded-lg resize-none"
  rows={4}
/>


{atividade?.arquivo_url && (
  <div className="mt-6 text-center">
    <button
      onClick={handleDownloadArquivosEnviados}
      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
    >
      📁 Baixar Arquivos Enviados (.zip)
    </button>
  </div>
)}

        {feitoArquivos.length > 0 && (
          <div className="mt-6 text-center">
            <div className="mb-4 space-y-2">
              {feitoArquivos.map((file) => (
                <div key={file.name} className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                  <span className="text-gray-700">{file.name}</span>
                  <button
                    onClick={() => {
                      setFeitoArquivos((prev) => prev.filter((f) => f.name !== file.name))
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

    {statusAtividade !== 'Atrasada' && statusAtividade !== 'Finalizada' && (
        <div className="mt-6">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="border p-2 rounded-lg"
          />
          {fileError && (
            <p className="text-red-600 mt-2">{fileError}</p>
          )}
          <button
            onClick={handleSubmit}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg"
          >
            Enviar Atividade
          </button>
        </div>
         )}
        {feitoUrls.length > 0 && (
          <div className="mt-6 text-center">
            <div className="mb-4 space-y-2">
              {arquivosNaPasta.map((file) => (
                <div key={file.name} className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                  <span className="text-gray-700">{file.name}</span>
                  <div>
                    <button
                      onClick={() => handleDownload(file.name)}
                      className="text-blue-500 hover:text-blue-700 mr-4"
                    >
                      Baixar
                    </button>
                    <button
                      onClick={() => handleRemove(file.name)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AtividadePage
