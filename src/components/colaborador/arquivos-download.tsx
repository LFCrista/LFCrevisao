"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { supabase } from "@/lib/supabase"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"

interface ArquivosDownloadProps {
  atividadeId: string
}

const ArquivosDownload: React.FC<ArquivosDownloadProps> = ({ atividadeId }) => {
  const [arquivos, setArquivos] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [pasta, setPasta] = React.useState<string | null>(null)
  const [nomeAtividade, setNomeAtividade] = React.useState<string>("")

  React.useEffect(() => {
    if (atividadeId) fetchCaminhoDaPasta(atividadeId)
  }, [atividadeId])

  React.useEffect(() => {
    if (pasta) fetchArquivosNaPasta(pasta)
  }, [pasta])

  const fetchCaminhoDaPasta = async (id: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from("atividades")
      .select("arquivo_url, titulo")
      .eq("id", id)
      .single()

    if (data?.arquivo_url) {
      const path = data.arquivo_url.replace(/\/$/, "")
      setPasta(path)
      setNomeAtividade(data.titulo)
    }

    setLoading(false)
  }

  const fetchArquivosNaPasta = async (folderPath: string) => {
    const { data, error } = await supabase.storage
      .from("atividades-enviadas")
      .list(folderPath, { limit: 100 })

    setArquivos(data ?? [])
  }

  const handleDownload = async (fileName: string) => {
    if (!pasta) return
    const filePath = `${pasta}/${fileName}`
    const { data, error } = await supabase.storage
      .from("atividades-enviadas")
      .download(filePath)

    if (data) {
      const url = URL.createObjectURL(data)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleDownloadAll = async () => {
    if (!pasta || arquivos.length === 0) return
    const zip = new JSZip()

    for (const arquivo of arquivos) {
      const filePath = `${pasta}/${arquivo.name}`
      const { data } = await supabase.storage
        .from("atividades-enviadas")
        .download(filePath)

      if (data) zip.file(arquivo.name, data)
    }

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, `${nomeAtividade}-arquivos.zip`)
    })
  }

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

        <div className="space-y-2">
          {loading ? (
            <p>Carregando arquivos...</p>
          ) : arquivos.length > 0 ? (
            <ul className="space-y-2 p-6">
              {arquivos.map((arquivo) => (
                <li key={arquivo.name} className="flex justify-between items-center">
                  <span>{arquivo.name}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDownload(arquivo.name)}
                  >
                    <Download />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum arquivo encontrado.</p>
          )}
        </div>

        <div className="mt-6">
          <Button variant="secondary" onClick={handleDownloadAll}>
            Baixar Todos os Arquivos
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default ArquivosDownload
