'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'

const AtividadePage = () => {
  const [atividade, setAtividade] = useState<any>(null)
  const [feitoUrl, setFeitoUrl] = useState<string | null>(null)
  const [feitoArquivo, setFeitoArquivo] = useState<File | null>(null)
  const [user, setUser] = useState<any>(null)
  const [arquivoNome, setArquivoNome] = useState<string | null>(null)  // Nome do arquivo "feito"
  const [editando, setEditando] = useState(false)
  const [tempoExpirado, setTempoExpirado] = useState(false) // Para verificar se o tempo de entrega expirou
  const params = useParams()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Erro ao obter sessão:', error.message)
      } else {
        setUser(session?.user || null)
      }
    }

    getUser()
  }, [])

  useEffect(() => {
    if (!params.id || !user) return

    const fetchAtividadeData = async () => {
      const { data, error } = await supabase
        .from('atividades')
        .select('id, titulo, descricao, user_id, arquivo_url, feito_url, start_date, end_date, concluida')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Erro ao buscar dados da atividade:', error.message)
        return
      }

      if (data) {
        setAtividade(data)

        // Verifica se a data de término já passou
        const currentDate = new Date()
        const endDate = new Date(data.end_date)
        if (endDate < currentDate) {
          setTempoExpirado(true)
        } else {
          setTempoExpirado(false)
        }

        if (data.feito_url) {
          setFeitoUrl(data.feito_url)
          // Nome do arquivo "feito"
          setArquivoNome(data.feito_url.split('/').pop() || '')
        }
        if (data.arquivo_url && !data.feito_url) {
          // Nome do arquivo da atividade apenas se não houver arquivo feito
          setArquivoNome(data.arquivo_url.split('/').pop() || '')
        }
      }
    }

    fetchAtividadeData()
  }, [params.id, user])

  const handleDownload = async (url: string | null, bucket: string) => {
    if (!url) {
      console.error('Erro: Nenhuma URL fornecida para o download.')
      return
    }

    if (!bucket) {
      console.error('Erro: Nenhum bucket fornecido para o download.')
      return
    }

    try {
      const { data: fileData, error } = await supabase.storage
        .from(bucket) // Bucket correto
        .download(url)

      if (error) {
        console.error(`Erro ao fazer download do arquivo do bucket ${bucket}:`, error.message)
        return
      }

      const fileBlob = new Blob([fileData], { type: 'application/octet-stream' })
      const fileUrl = URL.createObjectURL(fileBlob)
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = url.split('/').pop() || 'arquivo'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      console.error('Erro inesperado ao fazer o download:', error.message || error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFeitoArquivo(file)
      setArquivoNome(file.name)  // Atualiza o nome do arquivo "feito"
    }
  }

  const handleUploadFeito = async () => {
    if (!feitoArquivo) {
      alert('Por favor, selecione um arquivo para enviar.')
      return
    }

    const sanitizedMonth = new Date()
      .toLocaleString('default', { month: 'long' })
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    const sanitizedDay = new Date().getDate().toString().padStart(2, '0')

    const filePath = `${user?.id}/${new Date().getFullYear()}/${sanitizedMonth}/${sanitizedDay}/${feitoArquivo.name}`

    const { data, error } = await supabase.storage
      .from('atividades-recebidas')
      .upload(filePath, feitoArquivo, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('Erro ao fazer upload do arquivo feito:', error.message)
      return
    }

    setArquivoNome(data?.path.split('/').pop() || '')  // Atualiza o nome do arquivo feito

    const { error: updateError } = await supabase
      .from('atividades')
      .update({
        feito_url: data?.path,
        concluida: true, // Marcando como concluída
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Erro ao atualizar a atividade:', updateError.message)
    } else {
      console.log('Atividade atualizada com o novo arquivo feito.')
      window.location.reload()  // Recarrega a página após o upload
    }
  }

  const handleEditFile = () => {
    setEditando(true)
  }

  const handleReplaceFile = async () => {
    if (!feitoArquivo) {
      alert('Por favor, selecione um arquivo para substituir.')
      return
    }

    const { error: deleteError } = await supabase.storage
      .from('atividades-recebidas')
      .remove([atividade?.feito_url])

    if (deleteError) {
      console.error('Erro ao excluir o arquivo anterior:', deleteError.message)
      return
    }

    const sanitizedMonth = new Date()
      .toLocaleString('default', { month: 'long' })
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    const sanitizedDay = new Date().getDate().toString().padStart(2, '0')

    const filePath = `${user?.id}/${new Date().getFullYear()}/${sanitizedMonth}/${sanitizedDay}/${feitoArquivo.name}`

    const { data, error } = await supabase.storage
      .from('atividades-recebidas')
      .upload(filePath, feitoArquivo, { cacheControl: '3600', upsert: true })

    if (error) {
      console.error('Erro ao fazer upload do novo arquivo:', error.message)
      return
    }

    const { error: updateError } = await supabase
      .from('atividades')
      .update({ feito_url: data?.path })
      .eq('id', params.id)

    if (updateError) {
      console.error('Erro ao atualizar a atividade:', updateError.message)
    } else {
      console.log('Arquivo substituído com sucesso.')
      setEditando(false)
      setArquivoNome(data?.path.split('/').pop() || '')  // Atualiza o nome do arquivo feito
      window.location.reload()  // Recarrega a página após a substituição
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-6">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">Detalhes da Atividade</h2>

        {atividade ? (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">{atividade.titulo}</h3>
            <p className="text-gray-600">
              <strong>Descrição:</strong> {atividade.descricao}
            </p>
            <p className="text-gray-600">
              <strong>Data de Início:</strong> {atividade.start_date ? new Date(atividade.start_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
            </p>
            <p className="text-gray-600">
              <strong>Data de Término:</strong> {atividade.end_date ? new Date(atividade.end_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
            </p>
            {tempoExpirado && (
              <p className="text-red-500 font-semibold">O tempo para a entrega foi esgotado!</p>
            )}
            <p className="text-gray-600">
              <strong>Status:</strong> {tempoExpirado ? 'Atrasado' : (atividade.concluida ? 'Concluída' : 'Pendente')}
            </p>
          </div>
        ) : (
          <p className="text-gray-600">Carregando dados da atividade...</p>
        )}

        <div className="mt-6 flex flex-col items-start space-y-4">
          {/* Botão para Baixar a Atividade */}
          {atividade?.arquivo_url && (
            <button
              onClick={() => handleDownload(atividade.arquivo_url, 'atividades-enviadas')}
              className="py-2 px-6 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
            >
              Baixar Atividade
            </button>
          )}

          {/* Botão para Baixar o Arquivo Feito */}
          {feitoUrl && (
            <button
              onClick={() => handleDownload(feitoUrl, 'atividades-recebidas')}
              className="py-2 px-6 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none"
            >
              Baixar Arquivo Feito
            </button>
          )}
        </div>

        {/* Condicional de Exibição dependendo do Status da Atividade */}
        {atividade && atividade.concluida ? (
          <div className="mt-6 text-center">
            {arquivoNome && (
              <div className="mb-4">
                <span className="font-semibold text-gray-700">{arquivoNome}</span> {/* Exibe nome do arquivo feito */}
              </div>
            )}

            {editando ? (
              <>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="fileInput"
                />
                <label
                  htmlFor="fileInput"
                  className="cursor-pointer py-2 px-6 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                >
                  Escolher Novo Arquivo
                </label>

                {feitoArquivo && (
                  <button
                    onClick={handleReplaceFile}
                    className="mt-4 py-2 px-6 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none"
                  >
                    Substituir Arquivo
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleEditFile}
                className="mt-4 py-2 px-6 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none"
              >
                Editar Arquivo Feito
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 text-center">
            <input
              type="file"
              onChange={handleFileChange}
              className="mb-4"
            />
            <button
              onClick={handleUploadFeito}
              disabled={tempoExpirado} // Desabilita o envio se o tempo expirou
              className={`py-2 px-6 ${tempoExpirado ? 'bg-gray-400' : 'bg-blue-500'} text-white rounded-md hover:bg-blue-600 focus:outline-none`}
            >
              Enviar Arquivo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AtividadePage
