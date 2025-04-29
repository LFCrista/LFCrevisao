"use client"

import * as React from "react"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { CircleX, Upload } from "lucide-react"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

const sanitizePathComponent = (str: string) => {
  // Verifica se a string é válida antes de manipular
  if (typeof str !== "string") {
    throw new Error("Input must be a string");
  }

  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Remove acentos
    .replace(/[^\w\s-]/g, "")         // Remove caracteres especiais
    .trim()                           // Remove espaços extras
    .replace(/\s+/g, "-")             // Substitui espaços por -
    .toLowerCase();                   // Converte para minúsculas
}

// Garante que o nome do arquivo seja seguro e mantenha a extensão
const getSafeFileName = (originalName: string) => {
  const fileExtension = originalName.split('.').pop() || ''
  const fileNameWithoutExtension = originalName.replace(/\.[^/.]+$/, '')
  const sanitizedName = sanitizePathComponent(fileNameWithoutExtension)
  return `${sanitizedName}.${fileExtension.toLowerCase()}`
}

interface ArquivosAtvProps {
  atividadeId: string
}

const ArquivosAtv: React.FC<ArquivosAtvProps> = ({ atividadeId }) => {
  const [arquivos, setArquivos] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [pasta, setPasta] = React.useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = React.useState<FileList | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = React.useState(false) // Dialogo para confirmar substituição
  const [selectedFileToRemove, setSelectedFileToRemove] = React.useState<string | null>(null)
  const [selectedFileToReplace, setSelectedFileToReplace] = React.useState<File | null>(null)
  const [isUploadErrorDialogOpen, setIsUploadErrorDialogOpen] = React.useState(false)
  const [isUploadSuccessDialogOpen, setIsUploadSuccessDialogOpen] = React.useState(false)
  const [isDeleteSuccessDialogOpen, setIsDeleteSuccessDialogOpen] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Função para buscar o caminho da pasta da atividade
  const fetchCaminhoDaPasta = async (id: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from("atividades")
      .select("arquivo_url")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Erro ao buscar caminho da pasta:", error.message)
    } else if (data?.arquivo_url) {
      const pathLimpo = data.arquivo_url.replace(/\/$/, "")
      setPasta(pathLimpo)
    }
    setLoading(false)
  }

  // Função para buscar os arquivos da pasta
  const fetchArquivosNaPasta = async (folderPath: string) => {
    const { data, error } = await supabase.storage
      .from("atividades-enviadas")
      .list(folderPath, { limit: 100, offset: 0 })

    if (error) {
      console.error("Erro ao listar arquivos:", error.message)
    } else {
      setArquivos(data ?? [])
    }
  }

  // Função para remover um arquivo
  const handleRemove = async (fileName: string) => {
    if (!fileName || !pasta) return

    setSelectedFileToRemove(fileName)
    setIsConfirmDialogOpen(true)
  }

  // Função para confirmar a remoção de um arquivo
  const handleConfirmRemove = async () => {
    if (!selectedFileToRemove || !pasta) return

    const filePath = `${pasta}/${selectedFileToRemove}`
    try {
      const { error } = await supabase.storage
        .from("atividades-enviadas")
        .remove([filePath])

      if (error) {
        console.error("Erro ao remover o arquivo:", error.message)
        setIsUploadErrorDialogOpen(true)
        return
      }

      setArquivos((prev) => prev.filter((arquivo) => arquivo.name !== selectedFileToRemove))
      // Recarregar a lista de arquivos após a remoção e forçar atualização
      await fetchArquivosNaPasta(pasta)
      setIsDeleteSuccessDialogOpen(true)
    } catch (error: any) {
      console.error("Erro inesperado ao remover o arquivo:", error.message || error)
      setIsUploadErrorDialogOpen(true)
    } finally {
      setIsConfirmDialogOpen(false)
    }
  }

  // Função para lidar com a seleção de arquivos
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files)
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files)
    }
  }

  // Função para fazer o upload dos arquivos
  const handleUploadFiles = async (files: FileList) => {
    if (!pasta) return
    const uploadedFiles = []

    try {
      for (const file of Array.from(files)) {
        const safeFileName = getSafeFileName(file.name) // Normalizando o nome do arquivo
        const filePath = `${pasta}/${safeFileName}`

        // Verificar se o arquivo já existe no bucket
        const { data: existingFile, error: fileError } = await supabase.storage
          .from("atividades-enviadas")
          .download(filePath)

        // Se o arquivo já existir, perguntar se o usuário quer substituir
        if (existingFile) {
          setSelectedFileToReplace(file)
          setIsReplaceDialogOpen(true)
          return // Aguardar o usuário decidir se deseja substituir
        }

        // Realizar o upload do novo arquivo
        const { error } = await supabase.storage
          .from("atividades-enviadas")
          .upload(filePath, file, {
            upsert: false, // Não substitui automaticamente, já fazemos isso manualmente
          })

        if (error) {
          console.error(`Erro ao enviar ${file.name}:`, error.message)
          setIsUploadErrorDialogOpen(true)
          return
        }

        uploadedFiles.push(file) // Adiciona o arquivo à lista de arquivos enviados com sucesso
      }

      if (uploadedFiles.length > 0) {
        setIsUploadSuccessDialogOpen(true)
        // Forçar recarregar a lista de arquivos para garantir que o upload seja refletido
        await fetchArquivosNaPasta(pasta)
      }
    } catch (err: any) {
      console.error("Erro no envio de arquivos:", err.message)
      setIsUploadErrorDialogOpen(true)
    }
  }

  // Função para confirmar a substituição do arquivo
  const handleConfirmReplace = async () => {
    if (!selectedFileToReplace || !pasta) return

    const safeFileName = getSafeFileName(selectedFileToReplace.name) // Normalizando o nome do arquivo
    const filePath = `${pasta}/${safeFileName}`

    // Remover o arquivo existente
    const { error: removeError } = await supabase.storage
      .from("atividades-enviadas")
      .remove([filePath])

    if (removeError) {
      console.error(`Erro ao remover ${selectedFileToReplace.name}:`, removeError.message)
      setIsUploadErrorDialogOpen(true)
      return
    }

    // Realizar o upload do novo arquivo
    const { error } = await supabase.storage
      .from("atividades-enviadas")
      .upload(filePath, selectedFileToReplace, {
        upsert: false, // Não substitui automaticamente, já fazemos isso manualmente
      })

    if (error) {
      console.error(`Erro ao enviar ${selectedFileToReplace.name}:`, error.message)
      setIsUploadErrorDialogOpen(true)
      return
    }

    setIsReplaceDialogOpen(false)
    setIsUploadSuccessDialogOpen(true)
    await fetchArquivosNaPasta(pasta) // Atualiza a lista de arquivos
  }

  // Função para abrir o input de arquivos
  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()  // Aciona o input de arquivos programaticamente
    }
  }

  React.useEffect(() => {
    if (atividadeId) fetchCaminhoDaPasta(atividadeId)
  }, [atividadeId])

  React.useEffect(() => {
    if (pasta) fetchArquivosNaPasta(pasta)
  }, [pasta])

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Ver Arquivos</Button>
      </DrawerTrigger>
      <DrawerContent className="p-6 mb-5">
        <DrawerHeader>
          <DrawerTitle>Arquivos da Atividade</DrawerTitle>
          <DrawerClose />
        </DrawerHeader>

        {/* Exibindo os arquivos dentro do Drawer */}
        <div className="space-y-2">
          {loading ? (
            <p>Carregando arquivos...</p>
          ) : arquivos.length > 0 ? (
            <ul className="space-y-2 p-6">
              {arquivos.map((arquivo) => (
                <li key={arquivo.name} className="flex justify-between items-center">
                  <span>{arquivo.name}</span>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemove(arquivo.name)}
                    className="ml-2"
                  >
                    <CircleX />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum arquivo encontrado.</p>
          )}
        </div>

        {/* Botão para adicionar arquivos */}
        <div className="mt-6">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelection}
            className="hidden"
          />
          <Button variant="secondary" onClick={handleClickUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Adicionar Arquivos
          </Button>
        </div>
      </DrawerContent>

      {/* Alert Dialogs */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja remover este arquivo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleConfirmRemove}>Sim</AlertDialogAction>
          <AlertDialogCancel onClick={() => setIsConfirmDialogOpen(false)}>Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isReplaceDialogOpen} onOpenChange={setIsReplaceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar substituição</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo "{selectedFileToReplace?.name}" já existe. Deseja substituí-lo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleConfirmReplace}>Sim</AlertDialogAction>
          <AlertDialogCancel onClick={() => setIsReplaceDialogOpen(false)}>Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isUploadSuccessDialogOpen} onOpenChange={setIsUploadSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sucesso!</AlertDialogTitle>
            <AlertDialogDescription>
              Arquivos enviados com sucesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setIsUploadSuccessDialogOpen(false)}>Fechar</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteSuccessDialogOpen} onOpenChange={setIsDeleteSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sucesso!</AlertDialogTitle>
            <AlertDialogDescription>
              Arquivo removido com sucesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setIsDeleteSuccessDialogOpen(false)}>Fechar</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isUploadErrorDialogOpen} onOpenChange={setIsUploadErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erro</AlertDialogTitle>
            <AlertDialogDescription>
              Ocorreu um erro ao tentar realizar a operação. Por favor, tente novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setIsUploadErrorDialogOpen(false)}>Fechar</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </Drawer>
  )
}

export default ArquivosAtv
