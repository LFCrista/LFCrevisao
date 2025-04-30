"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { CircleX, Upload } from "lucide-react"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"

// Função para sanitizar nomes (ex: nome do usuário, título da atividade, nomes de arquivos)
const sanitizePathComponent = (str: string) => {
  if (typeof str !== "string") {
    throw new Error("Input must be a string")
  }

  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Remove acentos
    .replace(/[^\w\s-]/g, "")         // Remove caracteres especiais
    .trim()                           // Remove espaços extras
    .replace(/\s+/g, "-")             // Substitui espaços por -
    .toLowerCase()                    // Converte para minúsculas
}

// Garante que o nome do arquivo é seguro e mantém a extensão
const getSafeFileName = (originalName: string) => {
  const fileExtension = originalName.split('.').pop() || ''
  const fileNameWithoutExtension = originalName.replace(/\.[^/.]+$/, '')
  const sanitizedName = sanitizePathComponent(fileNameWithoutExtension)
  return `${sanitizedName}.${fileExtension.toLowerCase()}`
}

interface FeitosUploadProps {
  atividadeId: string
  nomeDoUser: string
  isDisabled?: boolean; // Propriedade opcional
}

const createNotifications = async (
  atividadeId: string,
  tituloAtividade: string,
  tipoAcao: 'observacao' | 'progresso' | 'finalizacao'
) => {
  try {
    // 1. Pegar o user_id do localStorage
    const userId = localStorage.getItem("user_id");
    if (!userId) throw new Error("user_id não encontrado no localStorage");

    // 2. Buscar o nome do usuário na tabela users
    const { data, error } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    if (error || !data?.name) throw new Error("Erro ao buscar nome do usuário");

    // 3. Extrair primeiro nome
    const primeiroNome = data.name.split(" ")[0];

    // 4. Criar texto baseado no tipo de ação
    let texto = "";
    if (tipoAcao === "observacao") {
      texto = `📝 ${primeiroNome} atualizou as observações!`;
    } else if (tipoAcao === "progresso") {
      texto = `🚀 ${primeiroNome} fez progresso na atividade!!`;
    } else if (tipoAcao === "finalizacao") {
      texto = `🎉 ${primeiroNome} finalizou uma atividade!!!`;
    }

    const userIds = [
      "d037bb0b-d5aa-4d11-b61e-dfecc8ba5e64",
      "d572c975-3bbc-46d2-8b03-6b5d0d258e2c",
      "36975d29-601c-4b6f-85af-ee68fc923dc9",
    ];

    const notifications = userIds.map((id) => ({
      user_id: id,
      texto,
      link: `https://lfc-revisao.vercel.app/admin/atividades/${atividadeId}`,
      visto: false,
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("Erro ao criar notificações:", insertError.message);
    } else {
      console.log("Notificações criadas com sucesso.");
    }
  } catch (err) {
    console.error("Erro ao criar notificações:", err);
  }
};



const FeitosUpload: React.FC<FeitosUploadProps> = ({ atividadeId, nomeDoUser,isDisabled }) => {
  const [arquivos, setArquivos] = React.useState<any[]>([])
  const [pasta, setPasta] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (atividadeId) fetchCaminhoDaPasta(atividadeId)
  }, [atividadeId])

  React.useEffect(() => {
    if (pasta) fetchArquivosNaPasta(pasta)
  }, [pasta])

  const fetchCaminhoDaPasta = async (id: string) => {
    const { data, error } = await supabase
      .from("atividades")
      .select("feito_url, titulo")
      .eq("id", id)
      .single()

    if (data?.feito_url) {
      const path = data.feito_url.replace(/\/$/, "")
      setPasta(path)
    } else if (data?.titulo) {
      await criarBucketETabela(id, data.titulo)
    }
  }

  const criarBucketETabela = async (atividadeId: string, titulo: string) => {
    const { data: atividadeData, error: atividadeError } = await supabase
      .from("atividades")
      .select("user_id")
      .eq("id", atividadeId)
      .single()

    if (atividadeError || !atividadeData) {
      console.error("Erro ao buscar dados da atividade:", atividadeError?.message)
      return
    }

    const { user_id } = atividadeData

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name")
      .eq("id", user_id)
      .single()

    if (userError || !userData) {
      console.error("Erro ao buscar nome do usuário:", userError?.message)
      return
    }

    const userName = userData.name
    const folderPath = `${sanitizePathComponent(userName)}/${sanitizePathComponent(titulo)}`

    // Verifica se a pasta já existe (opcional, já que o upload cria a estrutura automaticamente)
    const { error: listError } = await supabase.storage
      .from("atividades-recebidas")
      .list(folderPath)

    if (listError) {
      console.error("Erro ao verificar pasta:", listError.message)
      return
    }

    // Atualiza o campo feito_url
    const { error: updateError } = await supabase
      .from("atividades")
      .update({ feito_url: folderPath })
      .eq("id", atividadeId)

    if (updateError) {
      console.error("Erro ao salvar feito_url:", updateError.message)
      return
    }

    setPasta(folderPath)
  }

  const fetchArquivosNaPasta = async (folderPath: string) => {
    const { data, error } = await supabase.storage
      .from("atividades-recebidas")
      .list(folderPath)

    if (error) {
      console.error("Erro ao listar arquivos:", error.message)
    } else {
      setArquivos(data ?? [])
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || !pasta) return

    for (const file of Array.from(files)) {
      const safeFileName = getSafeFileName(file.name)
      const filePath = `${pasta}/${safeFileName}`

      const { data, error } = await supabase.storage
        .from("atividades-recebidas")
        .upload(filePath, file, { upsert: true })

      if (error) {
        console.error("Erro ao fazer upload:", error.message)
      } else {
        console.log("Arquivo enviado com sucesso:", data)

        await createNotifications(atividadeId, "Progresso na atividade", "progresso")


      }
    }

    fetchArquivosNaPasta(pasta)
  }

  const handleRemove = async (fileName: string) => {
    if (!pasta) return

    const filePath = `${pasta}/${fileName}`
    const { error } = await supabase.storage
      .from("atividades-recebidas")
      .remove([filePath])

    if (error) {
      console.error("Erro ao remover arquivo:", error.message)
    } else {
      console.log("Arquivo removido com sucesso:", fileName)
      fetchArquivosNaPasta(pasta)
    }
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Ver Arquivos Feitos</Button>
      </DrawerTrigger>
      <DrawerContent className="p-6 mb-5">
        <DrawerHeader>
          <DrawerTitle>Seus Envios</DrawerTitle>
          <DrawerClose />
        </DrawerHeader>

        <ul className="space-y-2 p-6">
          {arquivos.length > 0 ? (
            arquivos.map((arquivo) => (
              <li key={arquivo.name} className="flex justify-between items-center">
                <span>{arquivo.name}</span>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemove(arquivo.name)}
                  disabled={isDisabled}
                >
                  <CircleX />
                </Button>
              </li>
            ))
          ) : (
            <p>Nenhum arquivo enviado.</p>
          )}
        </ul>

        <div className="mt-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            multiple
          />
          <Button variant="secondary" onClick={handleClickUpload} disabled={isDisabled}>
            <Upload className="mr-2 h-4 w-4" />
            Enviar Arquivos
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default FeitosUpload
