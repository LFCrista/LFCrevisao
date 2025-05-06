"use client"

import * as React from "react"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead, TableCaption } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import {
  Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/admin/date-picker"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import ArquivosAtv from "@/components/admin/arquivos-atv"
import FeitosAtv from "@/components/admin/feitos-atv"
import { ComboboxStatus } from "./combobox-status"
import type { Status } from "./combobox-status"

import ArquivosDownload from "@/components/colaborador/arquivos-download"
import FeitosUpload from "@/components/colaborador/feitos-upload"
import { CalendarPrazo } from "./calendar-prazo"
import { useRouter } from "next/navigation"


interface Atividade {
  descricao: string
  id: string
  titulo: string
  start_date: string | null
  end_date: string | null
  entrega_date: string | null
  status: string
  user_id: string
  obs_envio?: string // <-- adiciona aqui
}

interface User {
  id: string
  name: string
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
      link: `https://lfc-revisao.vercel.app/admin/atividades?atividade=${atividadeId}`,
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






const ListAtv: React.FC = () => {
  const router = useRouter()
  const [atividades, setAtividades] = React.useState<Atividade[]>([])
  const [usuarios, setUsuarios] = React.useState<Map<string, string>>(new Map())
  const [loading, setLoading] = React.useState<boolean>(true)
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [totalPages, setTotalPages] = React.useState<number>(1)
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [selectedStatus, setSelectedStatus] = React.useState<Status | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [selectedAtividade, setSelectedAtividade] = React.useState<Atividade | null>(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false); // Estado do AlertDialog
  const [isSaving, setIsSaving] = React.useState(false); 
  const [obsEnvio, setObsEnvio] = React.useState<string>("")
  const [originalObsEnvio, setOriginalObsEnvio] = React.useState("")


  React.useEffect(() => {
    if (selectedAtividade) {
      const obs = selectedAtividade.obs_envio || ""
      setObsEnvio(obs)
      setOriginalObsEnvio(obs)
    }
  }, [selectedAtividade])


  React.useEffect(() => {
      const params = new URLSearchParams(window.location.search)
      const atividadeId = params.get("atividade")
    
      if (!atividadeId) return
    
      const atividadeLocal = atividades.find((a) => a.id === atividadeId)
    
      if (atividadeLocal) {
        setSelectedAtividade(atividadeLocal)
        setIsSheetOpen(true)
      } else {
        // Busca a atividade no Supabase caso não esteja nas atividades carregadas
        const fetchAtividadeById = async () => {
          const { data, error } = await supabase
            .from("atividades")
            .select("*")
            .eq("id", atividadeId)
            .single()
    
          if (error) {
            console.error("Erro ao buscar atividade por ID:", error)
            return
          }
     
  
          
    
          if (data) {
            setSelectedAtividade(data)
            setIsSheetOpen(true)
          }
        }
    
        fetchAtividadeById()
      }
    }, [])
  

  

  const ITEMS_PER_PAGE = 10

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "---"
    const date = new Date(dateString)
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  

  const fetchAtividades = async (page: number) => {
    const loggedUserId = localStorage.getItem("user_id");
  
    const { data: atividadesData, error } = await supabase
      .from("atividades")
      .select("*");
  
    if (error) {
      console.error("Erro ao buscar atividades:", error);
      return;
    }
  
    let filtradas = atividadesData.filter((a) =>
      a.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    // Filtra pelas atividades do usuário logado
    if (loggedUserId) {
      filtradas = filtradas.filter((a) => a.user_id === loggedUserId);
    }
  
    // Filtra pelo status selecionado (caso tenha sido escolhido)
    if (selectedStatus) {
      filtradas = filtradas.filter((a) => a.status === selectedStatus);
    }
  
    const atividadesComStatusAtualizado = await Promise.all(filtradas.map(async (atividade) => {
      if (atividade.end_date) {
        const dataAtual = new Date();
        const dataFim = new Date(atividade.end_date);
  
        if (atividade.concluida) {
          if (atividade.status !== "Concluída") {
            const { error: updateError } = await supabase
              .from("atividades")
              .update({ status: "Concluída" })
              .eq("id", atividade.id);
  
            if (!updateError) atividade.status = "Concluída";
          }
        } else {
          if (dataFim >= dataAtual && atividade.feito_url != null && atividade.status !== "Em Progresso") {
            const { error: updateError } = await supabase
              .from("atividades")
              .update({ status: "Em Progresso" })
              .eq("id", atividade.id);
            if (!updateError) atividade.status = "Em Progresso";
          } else if (dataFim >= dataAtual && atividade.feito_url == null && atividade.status !== "Pendente") {
            const { error: updateError } = await supabase
              .from("atividades")
              .update({ status: "Pendente" })
              .eq("id", atividade.id);
            if (!updateError) atividade.status = "Pendente";
          } else if (dataFim < dataAtual && atividade.status !== "Atrasada") {
            const { error: updateError } = await supabase
              .from("atividades")
              .update({ status: "Atrasada" })
              .eq("id", atividade.id);
            if (!updateError) atividade.status = "Atrasada";
          }
        }
      }
      return atividade;
    }));

    const handleTitleClick = (atividade: Atividade) => {
      setSelectedAtividade(atividade)  // Atualiza a atividade selecionada
    }
    
    

    const atividadesOrdenadas = [...filtradas].sort((a, b) => {
      const prioridade = (status: string) =>
        status === "Pendente" || status === "Em Progresso" ? 0 : 1

      const prioridadeA = prioridade(a.status)
      const prioridadeB = prioridade(b.status)

      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB
      }

      const endDateA = a.end_date ? new Date(a.end_date).getTime() : Infinity
      const endDateB = b.end_date ? new Date(b.end_date).getTime() : Infinity

      return endDateA - endDateB
    })

    const start = (page - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    setAtividades(atividadesOrdenadas.slice(start, end))
    setTotalPages(Math.ceil(atividadesOrdenadas.length / ITEMS_PER_PAGE))
    setLoading(false)
  }

  const fetchUsuarios = async () => {
    const { data: usuariosData, error } = await supabase
      .from("users")
      .select("id, name")

    if (error) {
      console.error("Erro ao buscar usuários:", error)
      return
    }

    const userMap = new Map<string, string>()
    usuariosData?.forEach((user: User) => {
      userMap.set(user.id, user.name)
    })

    setUsuarios(userMap)
  }

  React.useEffect(() => {
    fetchAtividades(currentPage)
    fetchUsuarios()
  }, [currentPage, searchTerm, selectedStatus])

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handlePageChange = (page: number) => setCurrentPage(page)

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "Concluída":
        return "default"
      case "Em Progresso":
        return "secondary"
      case "Pendente":
        return "outline"
      case "Atrasada":
        return "destructive"
      default:
        return "default"
    }
  }

  const handleTitleClick = (atividade: Atividade) => {
    setSelectedAtividade(atividade)
    setIsSheetOpen(true)
    router.push(`/feed?atividade=${atividade.id}`)
  }

  const handleFinalizar = async () => {
    if (!selectedAtividade || !selectedAtividade.id) {
      console.error("Atividade não selecionada ou ID ausente.");
      return;
    }
  
    const entregaDate = new Date().toISOString();
  
    // Atualiza no Supabase
    const { error } = await supabase
      .from("atividades")
      .update({
        concluida: true,
        status: "Concluída",
        entrega_date: entregaDate
      })
      .eq("id", selectedAtividade.id);
  
    if (error) {
      console.error("Erro ao finalizar atividade:", error.message);
      return;
    }
  
    // Buscar nome do usuário
    const userId = localStorage.getItem("user_id");
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();
  
    if (userError || !userData?.name) {
      console.error("Erro ao buscar nome do usuário.");
      return;
    }
  
    const nome_usuario = userData.name;
  
    // Enviar e-mail via API
    try {
      const response = await fetch("/api/send-concAtividade-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo_atividade: selectedAtividade.titulo,
          obs_envio: obsEnvio,
          atividadeId: selectedAtividade.id,
          nome_usuario: nome_usuario,
        }),
      });
  
      const result = await response.json();
      if (!result.success) {
        console.error("Erro ao enviar e-mail:", result.error);
      } else {
        console.log("E-mail enviado com sucesso.");
      }
    } catch (err) {
      console.error("Erro na requisição do e-mail:", err);
    }
  
    // Criar notificação e fechar modal
    await createNotifications(selectedAtividade.id, selectedAtividade.titulo, "finalizacao");
    setIsSheetOpen(false);
    window.location.reload();
  };
  

  
  
  

  

  const handleOpenAlertDialog = () => setIsAlertDialogOpen(true); // Abre o AlertDialog
  const handleCloseAlertDialog = () => setIsAlertDialogOpen(false); // Fecha o AlertDialog

  const handleDeleteAtividade = async () => {
    if (!selectedAtividade || !selectedAtividade.id) return;
  
    const { error } = await supabase
      .from("atividades")
      .delete()
      .eq("id", selectedAtividade.id);
  
    if (error) {
      console.error("Erro ao excluir atividade:", error.message);
      alert("Erro ao excluir a atividade.");
    } else {
      setIsSheetOpen(false);
      window.location.reload();
    }
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  
  

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4 ">
        <div className="flex items-center gap-2 flex-1">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => {
              setCurrentPage(1)
              setSearchTerm(e.target.value)
            }}
          />
        </div>

       
  <ComboboxStatus onSelectStatus={(status) => {
    setCurrentPage(1)
    setSelectedStatus(status)
  }} />
      </div>

      <Table className="min-w-full">
  <TableCaption>Atividades</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Título</TableHead>
      <TableHead>Prazo</TableHead>
      <TableHead>Data Entrega</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {atividades.map((atividade) => {
      return (
        <TableRow key={atividade.id}>
          <TableCell
            className="cursor-pointer hover:underline"
            onClick={() => handleTitleClick(atividade)}
          >
            {atividade.titulo}
          </TableCell>
          <TableCell>{formatDate(atividade.end_date)}</TableCell>
          <TableCell>{formatDate(atividade.entrega_date)}</TableCell>
          <TableCell>
            <Badge variant={getBadgeVariant(atividade.status)}>
              {atividade.status}
            </Badge>
          </TableCell>
        </TableRow>
      )
    })}
  </TableBody>
</Table>


      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={handlePrevPage} />
          </PaginationItem>

          {[...Array(totalPages).keys()].map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={currentPage === page + 1}
                onClick={() => handlePageChange(page + 1)}
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext onClick={handleNextPage} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja finalizar a atividade?</AlertDialogTitle>
            <AlertDialogDescription>
              Se finalizar a atividade não poderá mais alterar nada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleFinalizar}>Sim, Finalizar</AlertDialogAction>
          <AlertDialogCancel onClick={handleCloseAlertDialog}>Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      {/* Menu lateral (Sheet) para editar a atividade */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
        if (!open) router.replace("/feed")
  if (!open && selectedAtividade && obsEnvio !== originalObsEnvio) {
    supabase
      .from("atividades")
      .update({ obs_envio: obsEnvio })
      .eq("id", selectedAtividade.id)
      .then(({ error }) => {
        if (error) console.error("Erro ao salvar observações:", error)
        else console.log("Observações atualizadas com sucesso.")

        createNotifications(selectedAtividade.id, selectedAtividade.titulo, 'observacao');
      })
  }
  setIsSheetOpen(open)
}}>


<SheetContent
  side="right"
  className="overflow-y-auto "  // Adiciona a classe para rolagem
>
          <SheetHeader>
            <SheetTitle>Editar Atividade</SheetTitle>
            <SheetDescription>Alterar os dados da atividade</SheetDescription>
          </SheetHeader>

          {selectedAtividade && (
  <div className="space-y-4 p-4">
  <div className="space-y-1">
    <p className="text-sm font-medium text-muted-foreground">Título</p>
    <p className="text-base font-semibold">{selectedAtividade.titulo}</p>
  </div>

  <div className="space-y-1">
    <p className="text-sm font-medium text-muted-foreground">Descrição</p>
    <p className="text-base whitespace-pre-wrap">{selectedAtividade.descricao || "---"}</p>
  </div>

  <div className="space-y-1">
    <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
    <p className="text-base">{formatDate(selectedAtividade.start_date)}</p>
  </div>

  <div className="space-y-1">
    <p className="text-sm font-medium text-muted-foreground">Prazo</p>
    <p className="text-base">{formatDate(selectedAtividade.end_date)}</p>
  </div>

  <CalendarPrazo 
    startDate={selectedAtividade.start_date} 
    endDate={selectedAtividade.end_date} 
  />

  <div className="space-x-2">
    
  {selectedAtividade.status !== "Concluída" && selectedAtividade.status !== "Atrasada" && (
  <>
    <ArquivosDownload atividadeId={selectedAtividade.id} />
    <FeitosUpload 
      atividadeId={selectedAtividade.id} 
      isDisabled={false}  // Habilita o upload e remoção
    />
  </>
)}

{(selectedAtividade.status === "Concluída" || selectedAtividade.status === "Atrasada") && (
  <>
    <ArquivosDownload atividadeId={selectedAtividade.id} />
    <FeitosUpload atividadeId={selectedAtividade.id} isDisabled={false} />

  </>
)}
</div>

<div className="space-y-2">
  <label className="block text-sm font-medium text-muted-foreground">
    Observações do envio
  </label>
  <textarea
  className="w-full border rounded-md p-2 h-40 overflow-auto text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
  value={obsEnvio}
  onChange={(e) => setObsEnvio(e.target.value)}
  placeholder="Digite suas observações aqui..."
  disabled={selectedAtividade.status === "Concluída" || selectedAtividade.status === "Atrasada"} // Desabilita o campo de observações
/>

</div>

</div>

)}

<SheetFooter className="flex justify-center gap-4 p-4 mt-auto items-center">
  <Button
    variant="default"
    size="sm"
    className="w-50"
    onClick={handleOpenAlertDialog}
    disabled={isSaving || !selectedAtividade || selectedAtividade.status === "Concluída" || selectedAtividade.status === "Atrasada"} // Verifica se selectedAtividade não é null
  >
    Finalizar
  </Button>
</SheetFooter>



        </SheetContent>
      </Sheet>
    </div>
  )
}

export default ListAtv
