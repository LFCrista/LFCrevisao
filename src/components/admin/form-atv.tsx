"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/admin/date-picker"
import { ComboboxUsers } from "@/components/admin/combobox"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer"
import { CircleX } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation" // adicione no topo

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


const uploadFiles = async (user_id: string, activity_id: string, files: File[]) => {
  const folderPath = `${sanitizePathComponent(user_id)}/${sanitizePathComponent(activity_id)}/`
  const uploadedFiles = []

  for (const file of files) {
    const cleanFileName = getSafeFileName(file.name)
    const filePath = folderPath + cleanFileName

    const { data, error } = await supabase.storage
      .from("atividades-enviadas")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

    if (error) {
      console.error("Erro ao fazer upload do arquivo:", error.message)
      return null
    }

    uploadedFiles.push(data?.path)
  }

  return folderPath
}


const formSchema = z.object({
  title: z.string().min(2, {
    message: "Título deve ter pelo menos 2 caracteres.",
  }),
  description: z.string().min(5, {
    message: "A descrição deve ter pelo menos 5 caracteres.",
  }),
  inicio: z.date({
    required_error: "Data de início é obrigatória.",
  }).nullable(),
  prazo: z.date({
    required_error: "Prazo da atividade é obrigatória.",
  }).nullable(),
  user_id: z.string({
    required_error: "Selecione um colaborador.",
  }),
  files: z
    .array(z.instanceof(File))
    .min(1, {
      message: "Por favor, selecione pelo menos um arquivo.",
    }),
})

export function FormAtv() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      inicio: null,
      prazo: null,
      user_id: "",
      files: [],
    },
  })
  const router = useRouter() // adicione dentro do componente

  const [arquivos, setArquivos] = useState<File[]>([])
  const [fileExistsError, setFileExistsError] = useState<string | null>(null)
  const [filePreviews, setFilePreviews] = useState<File[]>([]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files)

      const duplicateFile = newFiles.find(file =>
        arquivos.some(existingFile => existingFile.name === file.name)
      )

      if (duplicateFile) {
        setFileExistsError(`O arquivo "${duplicateFile.name}" já foi carregado.`)
      } else {
        const updated = [...arquivos, ...newFiles]
        setArquivos(updated)
        form.setValue("files", updated)
        setFileExistsError(null)
      }
    }
  }

  const removeFile = (fileName: string) => {
    const updated = arquivos.filter(file => file.name !== fileName)
    setArquivos(updated)
    form.setValue("files", updated)

    const fileInput = document.getElementById("fileInput") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }
  const convertToUTCMinus3 = (dateString: string) => {
    const localDate = new Date(dateString)
    localDate.setHours(localDate.getHours() + 0)
    return localDate.toISOString()
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const userIdToSend = values.user_id
  
    const validStartDate = values.inicio ? convertToUTCMinus3(values.inicio.toISOString()) : null
    const validEndDate = values.prazo ? convertToUTCMinus3(values.prazo.toISOString()) : null
  
    // 1. Inserir a atividade inicialmente (sem arquivo_url)
    const { data: atividadeCriada, error: insertError } = await supabase
      .from("atividades")
      .insert([
        {
          titulo: values.title,
          descricao: values.description,
          user_id: userIdToSend,
          start_date: validStartDate,
          end_date: validEndDate,
          created_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single()
  
    if (insertError || !atividadeCriada) {
      console.error("Erro ao inserir atividade:", insertError?.message)
      return
    }
  
    const activityId = atividadeCriada.id
  
    // 2. Upload dos arquivos com o ID da atividade
    const arquivosCaminho: string[] = await Promise.all(
      values.files.map(async (file) => {
        const caminhoArquivo = await uploadFiles(userIdToSend, activityId.toString(), [file])
        return caminhoArquivo || ""
      })
    )
  
    // 3. Atualizar a atividade com o caminho do arquivo
    await supabase
      .from("atividades")
      .update({ arquivo_url: arquivosCaminho[0] })
      .eq("id", activityId)
  
    // 4. Criar notificação
    const { error: notificationError } = await supabase.from("notifications").insert([
      {
        user_id: userIdToSend,
        texto: "📌Nova atividade para você!!",
        link: `/feed?atividade=${activityId}`,
        visto: false,
        created_at: new Date().toISOString(),
      },
    ])
  
    if (notificationError) {
      console.error("Erro ao criar notificação:", notificationError.message)
    }
  
    // 5. Enviar e-mail
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", userIdToSend)
      .single()
  
    if (userError || !userData) {
      console.error("Erro ao buscar email do usuário:", userError?.message)
    } else {
      await fetch("/api/send-atividade-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userData.email,
          titulo: values.title,
          descricao: values.description,
          atividadeId: activityId,
        }),
      })
    }
  
    console.log("Atividade enviada com sucesso!")
    window.location.reload()
  }
  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Título */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título da atividade" {...field} />
              </FormControl>
              <FormDescription>Informe o título da atividade.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva a atividade" {...field} />
              </FormControl>
              <FormDescription>
                Informe uma breve descrição da atividade.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Início da atividade */}
        <FormField
          control={form.control}
          name="inicio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Início da Atividade</FormLabel>
              <FormControl>
                <DatePicker label="Início" value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Prazo da atividade */}
        <FormField
          control={form.control}
          name="prazo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prazo da Atividade</FormLabel>
              <FormControl>
                <DatePicker label="Prazo" value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Seleção de colaborador */}
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável</FormLabel>
              <FormControl>
                <ComboboxUsers onSelectUser={(user) => field.onChange(user ? user.id : "")} />
              </FormControl>
              <FormDescription>Escolha quem será responsável por essa atividade.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

<div className="flex items-center mt-4 ml-4 gap-4">
  <Drawer>
    <DrawerTrigger asChild>
      <Button variant="outline">Carregar Arquivos</Button>
    </DrawerTrigger>
    <DrawerContent className="p-8">
      <DrawerHeader>
        <DrawerTitle>Carregar Arquivos</DrawerTitle>
        <DrawerClose />
      </DrawerHeader>
      <FormItem>
        <FormLabel>Arquivos</FormLabel>
        <FormControl>
          <Input id="fileInput" type="file" multiple onChange={handleFileChange} />
        </FormControl>
        {fileExistsError && (
          <p className="text-sm text-red-500 mt-2">{fileExistsError}</p>
        )}
        {arquivos.length > 0 && (
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
            {arquivos.map((file, index) => (
              <li key={index} className="flex items-center justify-between gap-4">
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(file.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  <CircleX size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <FormMessage />
      </FormItem>
      <DrawerFooter className="pt-6">
        <DrawerClose asChild>
          <Button variant="secondary">Fechar</Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Button type="submit">Cadastrar Atividade</Button>
</div>

      </form>
    </Form>
  )
}
function getJwtToken() {
  throw new Error("Function not implemented.")
}

function convertToUTCMinus3(inicio: Date) {
  throw new Error("Function not implemented.")
}

function setFilePreviews(arg0: never[]) {
  throw new Error("Function not implemented.")
}

