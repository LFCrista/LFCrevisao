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
import { useSearchParams } from 'next/navigation'


interface Atividade {
  descricao: string
  id: string
  titulo: string
  start_date: string | null
  end_date: string | null
  entrega_date: string | null
  status: string
  user_id: string
  obs_envio?: string
  justificativa?: string // <-- adiciona aqui
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
      "36975d29-601c-4b6f-85af-ee68fc923dc9",
      "18b5c1ac-ff50-4ad4-a734-559bc154db5f",
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






const ListAtvConcluidas: React.FC = () => {
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
  const searchParams = useSearchParams()
  const [justificativa, setJustificativa] = React.useState("");
  const [originalJustificativa, setOriginalJustificativa] = React.useState<string>("")
  const [showAtrasadaDialog, setShowAtrasadaDialog] = React.useState(false);
  const [pendingSheetAtividade, setPendingSheetAtividade] = React.useState<Atividade | null>(null);


  const isFinalizarEnabled = selectedAtividade?.status === "Atrasada" ? !!justificativa : true;
  React.useEffect(() => {
    if (selectedAtividade) {
      const obs = selectedAtividade.obs_envio || ""
      setObsEnvio(obs)
      setOriginalObsEnvio(obs)
      const justificativaValor = (selectedAtividade as any).justificativa || ""
      setJustificativa(justificativaValor)
      setOriginalJustificativa(justificativaValor)
    }
    
  }, [selectedAtividade])


  React.useEffect(() => {
    const atividadeId = searchParams?.get("atividade")
    
    if (!atividadeId) return

    const atividadeLocal = atividades.find((a) => a.id === atividadeId)

    if (atividadeLocal) {
      setSelectedAtividade(atividadeLocal)
      setIsSheetOpen(true)
    } else {
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

      const abrirSheetComAlerta = (atividade: Atividade) => {
        setSelectedAtividade(atividade)
        setIsSheetOpen(true)
        if (atividade.status === "Atrasada") {
          setIsAlertDialogOpen(true)
        }
      }
    
      if (atividadeLocal) {
        abrirSheetComAlerta(atividadeLocal)
      } else {
        const fetchAtividadeById = async () => {
          const { data, error } = await supabase
            .from("atividades")
            .select("*")
            .eq("id", atividadeId)
            .single()
    
          if (data) abrirSheetComAlerta(data)
        }
        fetchAtividadeById()
      }

      fetchAtividadeById()
    }
  }, [searchParams, atividades]) 
  

  

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
  
    let filtradas = atividadesData
  .filter((a) =>
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter((a) => a.status === "Concluída" || a.status === "Fora de Prazo");


  
    // Filtra pelas atividades do usuário logado
    if (loggedUserId) {
      filtradas = filtradas.filter((a) => a.user_id === loggedUserId);
    }
  
    // Filtra pelo status selecionado (caso tenha sido escolhido)
    if (selectedStatus) {
      filtradas = filtradas.filter((a) => a.status === selectedStatus);
    }
  
    const atividadesComStatusAtualizado = await Promise.all(
  filtradas.map(async (atividade) => {
    if (!atividade.end_date) return atividade;

    const agora = new Date();
    const dataFim = new Date(atividade.end_date);

    // Não atualiza se já estiver como "Concluída" ou "Fora de Prazo"
    if (atividade.status === "Concluída" || atividade.status === "Fora de Prazo") {
      return atividade;
    }

    let novoStatus = atividade.status;

    if (dataFim < agora) {
      novoStatus = "Atrasada";
    } else if (atividade.feito_url) {
      novoStatus = "Em Progresso";
    } else {
      novoStatus = "Pendente";
    }

    // Atualiza apenas se o status mudou
    if (novoStatus !== atividade.status) {
      const { error: updateError } = await supabase
        .from("atividades")
        .update({ status: novoStatus })
        .eq("id", atividade.id);

      if (!updateError) {
        atividade.status = novoStatus;
      } else {
        console.error(`Erro ao atualizar status da atividade ${atividade.id}:`, updateError.message);
      }
    }

    return atividade;
  })
);



    

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
    if (atividade.status === "Atrasada") {
      setPendingSheetAtividade(atividade); // Salva atividade para abrir depois
      setShowAtrasadaDialog(true);         // Mostra o alerta
    } else {
      setSelectedAtividade(atividade);
      setIsSheetOpen(true);
      router.push(`/feed/finalizadas?atividade=${atividade.id}`);
    }
  };
  

  const handleFinalizar = async () => {
    if (!selectedAtividade || !selectedAtividade.id) {
      console.error("Atividade não selecionada ou ID ausente.");
      return;
    }
  
    const entregaDate = new Date().toISOString();
  
    const updateData: any = {
      concluida: true,
      entrega_date: entregaDate,
      obs_envio: obsEnvio,
    };
  
    const estaAtrasada = selectedAtividade.status === "Atrasada";

if (estaAtrasada) {
  if (!justificativa || justificativa.trim() === "") {
    alert("Para finalizar uma atividade atrasada, é necessário preencher a justificativa.");
    return;
  }
  updateData.status = "Fora de Prazo";
  updateData.justificativa = justificativa;
} else {
  updateData.status = "Concluída";
}

  
    const { error } = await supabase
      .from("atividades")
      .update(updateData)
      .eq("id", selectedAtividade.id);
  
    if (error) {
      console.error("Erro ao finalizar atividade:", error.message);
      return;
    }
  
    // Enviar notificação + email
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
  
    try {
      const response = await fetch("/api/send-concAtividade-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo_atividade: selectedAtividade.titulo,
          obs_envio: obsEnvio,
          justificativa: updateData.status === "Fora de Prazo" ? justificativa : "",
          atividadeId: selectedAtividade.id,
          nome_usuario,
        }),
      });
  
      const result = await response.json();
      if (!result.success) {
        console.error("Erro ao enviar e-mail:", result.error);
      }
    } catch (err) {
      console.error("Erro na requisição do e-mail:", err);
    }
  
    await createNotifications(
      selectedAtividade.id,
      selectedAtividade.titulo,
      "finalizacao"
    );
  
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

      <AlertDialog open={showAtrasadaDialog} onOpenChange={setShowAtrasadaDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Atividade Atrasada</AlertDialogTitle>
      <AlertDialogDescription>
        Esta atividade está <strong>atrasada</strong>. Para enviar, é necessário preencher o campo <strong>justificativa</strong> e fazer o upload dos arquivos realizados.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogAction
      onClick={() => {
        if (pendingSheetAtividade) {
          setSelectedAtividade(pendingSheetAtividade);
          router.push(`/feed/finalizadas?atividade=${pendingSheetAtividade.id}`);
        }
        setIsSheetOpen(true);
        setShowAtrasadaDialog(false);
        setPendingSheetAtividade(null);
      }}
    >
      Entendi
    </AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>


      {/* Menu lateral (Sheet) para editar a atividade */}
      <Sheet
  open={isSheetOpen}
  onOpenChange={async (open) => {
    if (!open) router.replace("/feed/finalizadas");

    if (!open && selectedAtividade) {
      const updates: any = {};

      if (obsEnvio !== originalObsEnvio) {
        updates.obs_envio = obsEnvio;
      }

      if (justificativa !== originalJustificativa) {
        updates.justificativa = justificativa;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("atividades")
          .update(updates)
          .eq("id", selectedAtividade.id);

        if (error) {
          console.error("Erro ao salvar alterações:", error);
        } else {
          console.log("Alterações salvas com sucesso.");

          if (updates.obs_envio) {
            createNotifications(selectedAtividade.id, selectedAtividade.titulo, "observacao");
          }
        }
      }
    }

    if (open && selectedAtividade?.status === "Atrasada") {
      setShowAtrasadaDialog(true); // exibe o alert-dialog antes de abrir o sheet
      return; // impede o sheet de abrir agora
    }

    setIsSheetOpen(open);
  }}
>




<SheetContent
  side="right"
  className="overflow-y-auto"
>
  <SheetHeader>
    <SheetTitle>Editar Atividade</SheetTitle>
    <SheetDescription>Alterar os dados da atividade</SheetDescription>
  </SheetHeader>

  {selectedAtividade && (
    <div className="space-y-4 p-4">
      {/* Título */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Título</p>
        <p className="text-base font-semibold">{selectedAtividade.titulo}</p>
      </div>

      {/* Descrição */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Descrição</p>
        <p className="text-base whitespace-pre-wrap">{selectedAtividade.descricao || "---"}</p>
      </div>

      {/* Data de Início */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
        <p className="text-base">{formatDate(selectedAtividade.start_date)}</p>
      </div>

      {/* Prazo */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Prazo</p>
        <p className="text-base">{formatDate(selectedAtividade.end_date)}</p>
      </div>

      {/* Calendário */}
      <CalendarPrazo 
        startDate={selectedAtividade.start_date} 
        endDate={selectedAtividade.end_date} 
      />

      {/* Botões de Arquivos e Upload */}
      <div className="space-x-2">
        {selectedAtividade.status !== "Concluída" && selectedAtividade.status !== "Fora de Prazo" && (
          <>
            <ArquivosDownload atividadeId={selectedAtividade.id} />
            <FeitosUpload 
              atividadeId={selectedAtividade.id} 
              isDisabled={false} // Habilita o upload e remoção
            />
          </>
        )}

        {(selectedAtividade.status === "Concluída" || selectedAtividade.status === "Fora de Prazo") && (
          <>
            <ArquivosDownload atividadeId={selectedAtividade.id} />
            <FeitosUpload 
              atividadeId={selectedAtividade.id} 
              isDisabled={true} // Desabilita o upload e remoção quando concluído ou fora de prazo
            />
          </>
        )}
      </div>

      {/* Justificativa do Atraso ou Fora de Prazo */}
      {(selectedAtividade?.status === "Atrasada" || selectedAtividade?.status === "Fora de Prazo") && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">
            Justificativa {selectedAtividade.status === "Fora de Prazo" ? "do Fora de Prazo" : "do Atraso"} <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border rounded-md p-2 h-32 overflow-auto text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Descreva o motivo do atraso ou fora de prazo..."
            disabled={selectedAtividade.status === "Fora de Prazo"} // Desabilita a edição se o status for "Fora de Prazo"
          />
        </div>
      )}

      {/* Observações do Envio */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">
          Observações do envio
        </label>
        <textarea
          className="w-full border rounded-md p-2 h-40 overflow-auto text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          value={obsEnvio}
          onChange={(e) => setObsEnvio(e.target.value)}
          placeholder="Digite suas observações aqui..."
          disabled={selectedAtividade.status === "Concluída" || selectedAtividade.status === "Fora de Prazo"} // Desabilita quando a atividade está concluída ou fora de prazo
        />
      </div>
    </div>
  )}

  {/* Rodapé com botão */}
  <SheetFooter className="flex justify-center gap-4 p-4 mt-auto items-center">
    <Button
      variant="default"
      size="sm"
      className="w-50"
      onClick={handleOpenAlertDialog}
      disabled={isSaving || !selectedAtividade || selectedAtividade.status === "Concluída" || selectedAtividade.status === "Fora de Prazo"} // Desabilita o botão quando a atividade está concluída ou fora de prazo
    >
      Finalizar
    </Button>
  </SheetFooter>
</SheetContent>


      </Sheet>
    </div>
  )
}

export default ListAtvConcluidas
