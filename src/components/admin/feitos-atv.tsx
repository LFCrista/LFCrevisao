"use client" // Adicionando a diretiva de "client" para habilitar hooks

import React from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react" // Ícone de download
import { supabase } from "@/lib/supabase"
import JSZip from "jszip" // Biblioteca para criar o arquivo .zip
import { saveAs } from "file-saver" // Para salvar o arquivo compactado no sistema


import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"

interface FeitosAtvProps {
  atividadeId: string
}

const FeitosAtv: React.FC<FeitosAtvProps> = ({ atividadeId }) => {
  const [arquivos, setArquivos] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [pasta, setPasta] = React.useState<string | null>(null)
  const [nomeAtividade, setNomeAtividade] = React.useState<string>("")
const [arquivosNaoVistos, setArquivosNaoVistos] = React.useState<Set<string>>(new Set())
const temNaoVistos = arquivosNaoVistos.size > 0


  const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null


React.useEffect(() => {
  const userId = localStorage.getItem("user_id")
  if (!userId || !pasta) return

  const fetchNaoVistos = async () => {
    const { data, error } = await supabase
      .from("new_arquivo")
      .select("caminho_arquivo")
      .eq("para", userId)
      .eq("visto", false)

    if (error) {
      console.error("Erro ao buscar arquivos não vistos:", error.message)
      return
    }

    const set = new Set(data.map((item) => item.caminho_arquivo))
    setArquivosNaoVistos(set)
  }

  fetchNaoVistos()
}, [pasta])


  // Função para buscar o caminho da pasta da atividade e o nome da atividade
  const fetchCaminhoDaPasta = async (id: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from("atividades")
      .select("feito_url, titulo")  // Alterando para 'titulo' no lugar de 'nome'
      .eq("id", id)
      .single()

    if (error) {
      console.error("Erro ao buscar caminho da pasta:", error.message)
    } else if (data?.feito_url) {
      const pathLimpo = data.feito_url.replace(/\/$/, "")
      setPasta(pathLimpo)

      // Agora estamos pegando o nome correto da atividade, que é 'titulo'
      setNomeAtividade(data.titulo)  // Alterando 'nome' para 'titulo'
    }
    setLoading(false)
  }

  // Função para buscar os arquivos da pasta
  const fetchArquivosNaPasta = async (folderPath: string) => {
    const { data, error } = await supabase.storage
      .from("atividades-recebidas")  // Usando o bucket 'atividades-recebidas'
      .list(folderPath, { limit: 100 })

    if (error) {
      console.error("Erro ao listar arquivos:", error.message)
    } else {
      setArquivos(data ?? [])
    }
  }

  // Função para baixar um arquivo específico
 const handleDownload = async (fileName: string) => {
  if (!pasta) return

  const userId = localStorage.getItem("user_id")
  const filePath = `${pasta}/${fileName}`

  const { data, error } = await supabase.storage
    .from("atividades-recebidas")
    .download(filePath)

  if (error) {
    console.error("Erro ao baixar o arquivo:", error.message)
    alert("Erro ao baixar o arquivo.")
    return
  }

  // Marcar como visto no Supabase
  const { error: updateError } = await supabase
    .from("new_arquivo")
    .update({ visto: true })
    .match({ caminho_arquivo: filePath, para: userId })

  if (updateError) {
    console.error("Erro ao marcar como visto:", updateError.message)
  }

  // ✅ Atualizar visualmente removendo do Set
  setArquivosNaoVistos((prev) => {
    const newSet = new Set(prev)
    newSet.delete(filePath)
    return newSet
  })

  // Iniciar download
  const url = URL.createObjectURL(data)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}



  // Função para baixar todos os arquivos como um arquivo .zip
  const handleDownloadAll = async () => {
    if (!pasta || arquivos.length === 0) return

    const zip = new JSZip()

    // Adicionando cada arquivo ao arquivo .zip
    for (const arquivo of arquivos) {
      const filePath = `${pasta}/${arquivo.name}`
      const { data, error } = await supabase.storage
        .from("atividades-recebidas")
        .download(filePath)

      if (error) {
        console.error("Erro ao baixar o arquivo:", error.message)
        alert("Erro ao baixar algum arquivo.")
        return
      }

      zip.file(arquivo.name, data) // Adiciona o arquivo ao zip
    }

    // Gerar o arquivo .zip e permitir o download
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, `${nomeAtividade}-feito.zip`) // Nome do arquivo .zip
    })
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
  <div className="relative inline-block">
    <Button variant="outline">Ver Arquivos Feitos</Button>

    {temNaoVistos && (
      <span className="absolute -top-1 -right-1 flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
        <span className="relative inline-flex size-2 rounded-full bg-sky-500"></span>
      </span>
    )}
  </div>
</DrawerTrigger>

  <DrawerContent className="p-6 mb-5">
    <DrawerHeader>
      <DrawerTitle>Arquivos Feitos da Atividade</DrawerTitle>
      <DrawerClose />
    </DrawerHeader>

    {/* Exibindo os arquivos dentro do Drawer */}
    <div className="space-y-2">
      {loading ? (
        <p>Carregando arquivos...</p>
      ) : arquivos.length > 0 ? (
        <ul className="space-y-2 p-6">
          {arquivos.map((arquivo) => {
            const caminhoCompleto = `${pasta}/${arquivo.name}`
            const naoVisto = arquivosNaoVistos.has(caminhoCompleto)

            return (
              <li key={arquivo.name} className="flex justify-between items-center">
                <span className={naoVisto ? "text-blue-500 font-medium" : ""}>
                  {arquivo.name}
                </span>

                <div className="relative">
                  {naoVisto && (
                    <span className="absolute -top-1 -right-1 flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex size-2 rounded-full bg-sky-500"></span>
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDownload(arquivo.name)}
                    className="ml-2"
                  >
                    <Download />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p>Nenhum arquivo encontrado.</p>
      )}
    </div>

    {/* Botão para baixar todos os arquivos */}
    <div className="mt-6">
      <Button variant="secondary" onClick={handleDownloadAll}>
        Baixar Todos os Arquivos
      </Button>
    </div>
  </DrawerContent>
</Drawer>

  )
}

export default FeitosAtv
