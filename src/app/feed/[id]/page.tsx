'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'
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
  const [erroUsuario, setErroUsuario] = useState<string | null>(null) // Estado para erro
  const [finalizarEntrega, setFinalizarEntrega] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const params = useParams()
  const router = useRouter() // Importar useRouter para redirecionamento

  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) console.error('Erro ao obter sessão:', error.message)
      else setUser(session?.user || null)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (!params?.id) return; // Verifica se o parâmetro 'id' está disponível
  
    const fetchAtividadeData = async () => {
      const { data, error } = await supabase
        .from('atividades')
        .select('id, titulo, descricao, user_id, arquivo_url, feito_url, start_date, end_date, concluida, obs_envio, status')
        .eq('id', params.id)
        .single()
  
      if (error) {
        console.error('Erro ao buscar dados da atividade:', error.message)
        return
      }
  
      if (data) {
        // Aqui, obtemos o 'user_id' do 'localStorage' (ou de onde quer que esteja armazenado)
        const localUserId = localStorage.getItem('user_id'); // ou o nome da chave no localStorage
  
        // Verifica se o 'user_id' da atividade corresponde ao 'user_id' no localStorage
        if (data.user_id !== localUserId) {
          setErroUsuario('Esta atividade não é para você.');
          setTimeout(() => {
            router.push('/')  // Redireciona para a página inicial
          }, 3000);
          return;
        }
  
        setAtividade(data);
        setObservacaoEnvio(data.obs_envio ?? '');
  
        
          const currentDate = new Date();
          const endDate = new Date(data.end_date);
          let novoStatus = 'Pendente';
        
          // Verificar se a atividade já foi finalizada
          if (data.status === 'Concluída') {
            novoStatus = 'Concluída';  // Mantém o status como Concluída
          } else if (currentDate > endDate && data.status !== 'Concluída') {
            novoStatus = 'Atrasada';
          } else if (data.feito_url) {
            novoStatus = 'Em Progresso';
          }
        
          // Atualiza o estado de status da atividade
          setStatusAtividade(novoStatus);
  
        

  

        if (data.feito_url) {
          const folderPath = data.feito_url;
          setFeitoUrls([folderPath]);
          fetchArquivosNaPasta(folderPath);
        }
  
        fetchNomeUsuario(data.user_id);
      }
    }
  
    fetchAtividadeData();
  }, [params?.id]);  // Executa sempre que o parâmetro 'id' mudar
  // Dependendo de params?.id e user

  const fetchNomeUsuario = async (userId: string) => {
    if (!params?.id) return; // Verifica se params está disponível
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar nome do usuário:', error.message);
    } else {
      setNomeUsuario(data?.name || ''); // Armazena o nome completo no estado
    }
  };

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
        .list(folderPath, { limit: 100 })  // Ajuste o limite conforme necessário
  
      if (error) {
        console.error('Erro ao listar arquivos:', error.message)
        return
      }
  
      // Atualiza o estado com os novos arquivos da pasta
      if (data?.length) setArquivosNaPasta(data)
    } catch (error: any) {
      console.error('Erro inesperado ao listar arquivos:', error.message || error)
    }
  }
  

  const handleDownload = async (fileName: string) => {
    if (!fileName || !feitoUrls.length) return
  
    try {
      const folderPath = feitoUrls[0]
      const filePath = `${folderPath}/${fileName}`
  
      // Gera uma URL assinada com validade de 60 segundos
      const { data, error } = await supabase.storage
        .from('atividades-recebidas')
        .createSignedUrl(filePath, 60)
  
      if (error || !data?.signedUrl) {
        console.error('Erro ao gerar URL assinada:', error?.message)
        return
      }
  
      // Adiciona um cache-buster na URL
      const cacheBustedUrl = `${data.signedUrl}&cb=${Date.now()}`
  
      // Faz o download com fetch
      const response = await fetch(cacheBustedUrl)
      const blob = await response.blob()
  
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
  
      // Libera a URL da memória
      URL.revokeObjectURL(url)
  
    } catch (err: any) {
      console.error('Erro inesperado no download:', err.message || err)
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
  
      // Atualiza o estado dos arquivos imediatamente após a seleção
      setFeitoArquivos(prev => [...prev, ...newFiles])
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  

  const sanitizePathComponent = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s.-]/g, '')       
      .trim()
      .replace(/\s+/g, '-')            
      .toLowerCase()
  }

  const handleSubmit = async () => {
    if (!params?.id) return;
  
    // Verifica se o usuário está tentando enviar apenas a observação sem arquivos
    if (feitoArquivos.length === 0 && feitoUrls.length === 0 && !observacaoEnvio) {
      console.error('Você precisa anexar pelo menos um arquivo ou adicionar uma observação.');
      return;
    }
  
    // Verifica se o usuário está tentando enviar apenas a observação sem arquivos no bucket
    if (feitoArquivos.length === 0 && arquivosNaPasta.length === 0 && observacaoEnvio) {
      alert('Você precisa enviar pelo menos um arquivo antes de adicionar uma observação.');
      return;
    }
  
    try {
      const safeTitle = sanitizePathComponent(atividade?.titulo || 'atividade');
      const safeUser = sanitizePathComponent(nomeUsuario); // Usa o nome completo para o bucket
      const baseFolderPath = `${safeUser}/${safeTitle}`; // Caminho simplificado
  
      let tipoAcao: 'observacao' | 'progresso' | 'finalizacao' = 'observacao';
  
      // Verifica se arquivos foram adicionados
      if (feitoArquivos.length > 0) {
        tipoAcao = 'progresso';
      }
  
      // Verifica se o usuário marcou como finalizado
      if (finalizarEntrega) {
        const confirmacao = window.confirm('Você tem certeza que deseja finalizar a atividade?');
        if (!confirmacao) return;
  
        tipoAcao = 'finalizacao';
      }
  
      // Upload dos arquivos, se houver
      for (const file of feitoArquivos) {
        const sanitizedName = sanitizePathComponent(file.name);
        const fullPath = `${baseFolderPath}/${sanitizedName}`;
  
        const existingFile = arquivosNaPasta.find(f => f.name === sanitizedName);
  
        if (existingFile) {
          const userConfirmed = window.confirm(`O arquivo "${sanitizedName}" já existe. Deseja atualizar?`);
          if (userConfirmed) {
            const { error: removeError } = await supabase.storage
              .from('atividades-recebidas')
              .remove([fullPath]);
  
            if (removeError) {
              console.error('Erro ao remover o arquivo existente:', removeError.message);
              return;
            }
          } else {
            continue;
          }
        }
  
        const { error: uploadError } = await supabase.storage
          .from('atividades-recebidas')
          .upload(fullPath, file);
  
        if (uploadError) {
          console.error('Erro ao fazer upload do arquivo:', uploadError.message);
          return;
        }
      }
  
      // Define status com base na escolha do usuário
      let statusFinal = 'Em Progresso';
  
      if (finalizarEntrega) {
        statusFinal = 'Concluída';
      }
  
      // Atualiza dados da atividade
      const { data, error: updateError } = await supabase
        .from('atividades')
        .update({
          feito_url: baseFolderPath,
          entrega_date: new Date().toISOString(),
          obs_envio: observacaoEnvio,
          status: statusFinal,
        })
        .eq('id', params.id)
        .select('*')
        .single();
  
      if (updateError) {
        console.error('Erro ao atualizar a atividade:', updateError.message);
        return;
      }
  
      setStatusAtividade(statusFinal);
  
      // Criar notificações para os usuários
      await createNotifications(params.id, atividade?.titulo || 'Atividade', tipoAcao);
  
      if (statusFinal === 'Concluída') {
        alert('A atividade foi concluída. Não será possível fazer mais alterações.');
      } else {
        alert('Atividade enviada com sucesso!');
      }
  
      setFeitoArquivos([]);
      fetchArquivosNaPasta(baseFolderPath);
  
      // Recarrega a página
      window.location.reload();
    } catch (error: any) {
      console.error('Erro inesperado:', error.message || error);
    }
  };
  

  const createNotifications = async (
    atividadeId: string,
    tituloAtividade: string,
    tipoAcao: 'observacao' | 'progresso' | 'finalizacao'
  ) => {
    try {
      const primeiroNome = nomeUsuario.split(' ')[0]; // Extrai apenas o primeiro nome
      let texto = '';
  
      // Define a mensagem com base no tipo de ação
      if (tipoAcao === 'observacao') {
        texto = `📝 ${primeiroNome} atualizou as observações!`;
      } else if (tipoAcao === 'progresso') {
        texto = `🚀 ${primeiroNome} fez progresso na atividade!!`;
      } else if (tipoAcao === 'finalizacao') {
        texto = `🎉 ${primeiroNome} finalizou uma atividade!!!`;
      }
  
      // IDs dos usuários que receberão a notificação
      const userIds = [
        'd037bb0b-d5aa-4d11-b61e-dfecc8ba5e64',
        'd572c975-3bbc-46d2-8b03-6b5d0d258e2c',
        '36975d29-601c-4b6f-85af-ee68fc923dc9',
      ];
  
      // Cria notificações para cada usuário
      const notifications = userIds.map((userId) => ({
        user_id: userId,
        texto,
        link: `https://lfc-revisao.vercel.app/admin/atividades/${atividadeId}`,
        visto: false, // Define como não vista inicialmente
      }));
  
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);
  
      if (error) {
        console.error('Erro ao criar notificações:', error.message);
      } else {
        console.log('Notificações criadas com sucesso.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao criar notificações:', error.message);
      } else {
        console.error('Erro ao criar notificações:', error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-6">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">Detalhes da Atividade</h2>

        {erroUsuario && (
          <div className="bg-red-500 text-white p-4 rounded-md mb-4">
            <strong>{erroUsuario}</strong> Você será redirecionado em breve.
          </div>
        )}

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
  disabled={statusAtividade === 'Concluída' || statusAtividade === 'Atrasada'}
/>
{statusAtividade !== 'Concluída' && statusAtividade !== 'Atrasada' &&(
<div className="mt-4 flex items-start gap-2">
  <input
    type="checkbox"
    id="finalizar-entrega"
    checked={finalizarEntrega}
    onChange={(e) => setFinalizarEntrega(e.target.checked)}
    disabled={statusAtividade === 'Finalizada' || statusAtividade === 'Atrasada'}
  />
  <label htmlFor="finalizar-entrega" className="text-gray-700">
    Entregar e finalizar atividade (você não poderá mais editar depois)
  </label>
</div>
)}


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

    {statusAtividade !== 'Atrasada' && statusAtividade !== 'Concluída' && (
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
          {statusAtividade !== 'Concluída' && statusAtividade !== 'Atrasada' &&(
          <button
  onClick={handleSubmit}
  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg"
  disabled={statusAtividade === 'Concluída' || statusAtividade === 'Atrasada'}
>
  Enviar Atividade
</button>
)}
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
      {statusAtividade !== 'Concluída' && statusAtividade !== 'Atrasada' &&(
      <button
        onClick={() => handleRemove(file.name)}
        className="text-red-500 hover:text-red-700"
        disabled={statusAtividade === 'Concluída' || statusAtividade === 'Atrasada'}
      >
        Remover
      </button>
      )}
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
