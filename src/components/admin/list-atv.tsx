"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead, TableCaption } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import {
  Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { ComboboxUsers } from "@/components/admin/combobox"
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/admin/date-picker"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import ArquivosAtv from "@/components/admin/arquivos-atv"
import FeitosAtv from "@/components/admin/feitos-atv"


interface Atividade {
  descricao: string
  id: string
  titulo: string
  start_date: string | null
  end_date: string | null
  entrega_date: string | null
  status: string
  user_id: string
  baixado: boolean
  obs_envio?: string // <-- adiciona isso
}

interface User {
  id: string
  name: string
}

const ListAtv: React.FC = () => {
  const router = useRouter()
  const [atividades, setAtividades] = React.useState<Atividade[]>([])
  const [usuarios, setUsuarios] = React.useState<Map<string, string>>(new Map())
  const [loading, setLoading] = React.useState<boolean>(true)
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [totalPages, setTotalPages] = React.useState<number>(1)
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [selectedAtividade, setSelectedAtividade] = React.useState<Atividade | null>(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false); // Estado do AlertDialog
  const [isSaving, setIsSaving] = React.useState(false); 
  const [baixadoChecked, setBaixadoChecked] = React.useState<boolean>(false);
  const [selectedAtividadeId, setSelectedAtividadeId] = React.useState<string | null>(null);
  

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

  const handleCheckboxChange = async (atividadeId: string, checked: boolean) => {
  // Atualiza o estado local para refletir a mudança
  const updatedAtividades = atividades.map((atividade) => 
    atividade.id === atividadeId 
      ? { ...atividade, baixado: checked } 
      : atividade
  );
  setAtividades(updatedAtividades);

  // Agora, atualiza o banco de dados
  const { error } = await supabase
    .from('atividades')
    .update({ baixado: checked })
    .eq('id', atividadeId);

  if (error) {
    console.error('Erro ao atualizar a atividade:', error);
    alert('Erro ao atualizar a atividade.');
  }
};

  

  // Função para realizar a atualização no banco de dados
  const updateBaixado = async (atividadeId: string, checked: boolean) => {
    const { error } = await supabase
      .from("atividades")
      .update({ baixado: checked })
      .eq("id", atividadeId);

    if (error) {
      console.error("Erro ao atualizar a atividade:", error);
      alert("Erro ao atualizar a atividade.");
    } else {
      fetchAtividades(currentPage); // Atualiza as atividades após a mudança
    }
  };

  // Função para confirmar a alteração e atualizar o estado de 'baixado'
  const handleConfirmChange = () => {
    if (selectedAtividadeId) {
      updateBaixado(selectedAtividadeId, baixadoChecked);
      setIsAlertDialogOpen(false); // Fecha o AlertDialog
    }
  };

  const fetchAtividades = async (page: number) => {
    const { data: atividadesData, error } = await supabase
      .from("atividades")
      .select("*")

    if (error) {
      console.error("Erro ao buscar atividades:", error)
      return
    }

    let filtradas = atividadesData.filter((a) =>
      a.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (selectedUser) {
      filtradas = filtradas.filter((a) => a.user_id === String(selectedUser.id))
    }

    const atividadesComStatusAtualizado = await Promise.all(filtradas.map(async (atividade) => {
      if (atividade.end_date) {
        const dataAtual = new Date();
        const dataFim = new Date(atividade.end_date);
    
        // Verifica as condições de status
        if (atividade.concluida) {
          // Se a atividade estiver concluída, o status é 'Concluída'
          if (atividade.status !== "Concluída") {
            const { error: updateError } = await supabase
              .from("atividades")
              .update({ status: "Concluída" })
              .eq("id", atividade.id);
    
            if (updateError) {
              console.error("Erro ao atualizar status para Concluída:", updateError);
            } else {
              atividade.status = "Concluída"; // Atualiza localmente após sucesso
            }
          }
        } else {
          // Se a data de término não passou e o feito_url estiver com um valor
          if (dataFim >= dataAtual && atividade.feito_url != null && atividade.status !== "Em Progresso") {
            const { error: updateError } = await supabase
              .from("atividades")
              .update({ status: "Em Progresso" })
              .eq("id", atividade.id);
    
            if (updateError) {
              console.error("Erro ao atualizar status para Em Progresso:", updateError);
            } else {
              atividade.status = "Em Progresso"; // Atualiza localmente após sucesso
            }
          }
          // Se a data de término não passou e o feito_url for null
          else if (dataFim >= dataAtual && atividade.feito_url == null && atividade.status !== "Pendente") {
            const { error: updateError } = await supabase
              .from("atividades")
              .update({ status: "Pendente" })
              .eq("id", atividade.id);
    
            if (updateError) {
              console.error("Erro ao atualizar status para Pendente:", updateError);
            } else {
              atividade.status = "Pendente"; // Atualiza localmente após sucesso
            }
          }
          // Se a data de término passou e a atividade não foi concluída, o status é 'Atrasada'
          else if (dataFim < dataAtual && atividade.status !== "Atrasada") {
            const { error: updateError } = await supabase
              .from("atividades")
              .update({ status: "Atrasada" })
              .eq("id", atividade.id);
    
            if (updateError) {
              console.error("Erro ao atualizar status para Atrasada:", updateError);
            } else {
              atividade.status = "Atrasada"; // Atualiza localmente após sucesso
            }
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
  }, [currentPage, searchTerm, selectedUser])

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
    router.push(`/admin/atividades?atividade=${atividade.id}`)
  }
  

  const handleSaveChanges = async () => {
    // Verifica se a atividade foi selecionada corretamente e se a ID existe
    if (!selectedAtividade || !selectedAtividade.id) {
      console.error("Atividade não selecionada ou ID ausente.");
      alert("Atividade não selecionada ou ID ausente.");
      return;
    }
  
    const { id, ...dadosParaAtualizar } = selectedAtividade;
  
    setIsSaving(true); // Ativa o estado de salvamento
  
    const { error } = await supabase
      .from('atividades')
      .update(dadosParaAtualizar)
      .eq('id', id);
  
    setIsSaving(false); // Desativa o estado de salvamento
  
    if (error) {
      console.error('Erro ao atualizar atividade:', error);
      alert('Erro ao salvar alterações.');
    } else {
      setIsSheetOpen(false); // Fecha o modal após salvar
      window.location.reload(); // Recarrega a página para refletir as alterações
    }
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

  const handleSelectAtividade = (atividade: Atividade) => {
    setSelectedAtividade(atividade);  // Atribui a atividade selecionada ao estado
  };

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

        <ComboboxUsers onSelectUser={(user) => {
          setCurrentPage(1)
          setSelectedUser(user)
        }} />
      </div>

      <Table className="min-w-full">
        <TableCaption>Atividades</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>Data Fim</TableHead>
            <TableHead>Data Entrega</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Baixado</TableHead> {/* Nova coluna */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {atividades.map((atividade) => {
            const usuarioNome = usuarios.get(atividade.user_id) || "Desconhecido";
            const nomeSplit = usuarioNome.split(" "); // Divide o nome completo em um array de palavras
            const nomeExibido = nomeSplit[0]; // Mostra apenas o primeiro nome
            
            return (
              <TableRow key={atividade.id}>
                <TableCell
                  className="cursor-pointer hover:underline"
                  onClick={() => handleTitleClick(atividade)}
                >
                  {atividade.titulo}
                </TableCell>
                <TableCell>{formatDate(atividade.start_date)}</TableCell>
                <TableCell>{formatDate(atividade.end_date)}</TableCell>
                <TableCell>{formatDate(atividade.entrega_date)}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(atividade.status)}>
                    {atividade.status}
                  </Badge>
                </TableCell>
                <TableCell>{nomeExibido}</TableCell>
                <TableCell>
          <input
            type="checkbox"
            checked={atividade.baixado}
            onChange={(e) => handleCheckboxChange(atividade.id, e.target.checked)}
          />
        </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

       {/* AlertDialog para confirmar a desmarcação */}
       <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar desmarcação</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza de que deseja desmarcar este checkbox?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleConfirmChange}>Sim, desmarcar</AlertDialogAction>
          <AlertDialogCancel onClick={() => setIsAlertDialogOpen(false)}>Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogTitle>Confirmar Atualização</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja atualizar os dados desta atividade?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleSaveChanges}>Sim, Atualizar</AlertDialogAction>
          <AlertDialogCancel onClick={handleCloseAlertDialog}>Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      {/* Menu lateral (Sheet) para editar a atividade */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
  setIsSheetOpen(open)
  if (!open) router.replace("/admin/atividades")
}}>

        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Editar Atividade</SheetTitle>
            <SheetDescription>Alterar os dados da atividade</SheetDescription>
          </SheetHeader>

          {selectedAtividade && (
  <div className="space-y-4 p-4">
    {/* Título */}
    <div className="space-y-2">
      <label htmlFor="titulo" className="block text-sm font-medium">Título</label>
      <Input
        id="titulo"
        value={selectedAtividade.titulo}
        onChange={(e) =>
          setSelectedAtividade({
            ...selectedAtividade,
            titulo: e.target.value,
          })
        }
        placeholder="Título da atividade"
      />
    </div>

    {/* Descrição */}
    <div className="space-y-2">
      <label htmlFor="descricao" className="block text-sm font-medium">Descrição</label>
      <textarea
        id="descricao"
        value={selectedAtividade.descricao || ""}
        onChange={(e) =>
          setSelectedAtividade({
            ...selectedAtividade,
            descricao: e.target.value,
          })
        }
        placeholder="Descrição da atividade"
        rows={4} // Define o tamanho do campo de texto
        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    {/* Responsável */}
    <div className="space-y-2">
        <label htmlFor="responsavel" className="block text-sm font-medium">Responsável</label>
        <div className="p-2 border rounded-md text-sm">
          {usuarios.get(selectedAtividade.user_id) || "Desconhecido"} {/* Exibe o nome completo do responsável */}
        </div>
      </div>

    {/* Data Início */}
    <div className="space-y-2">
      <label htmlFor="start_date" className="block text-sm font-medium">Data de Início</label>
      <DatePicker
        label="Data Início"
        value={selectedAtividade.start_date ? new Date(selectedAtividade.start_date) : null}
        onChange={(date) => {
          setSelectedAtividade({
            ...selectedAtividade,
            start_date: date ? date.toISOString() : null,
          })
        }}
      />
    </div>

    {/* Prazo (Data Fim) */}
    <div className="space-y-2">
      <label htmlFor="end_date" className="block text-sm font-medium">Prazo</label>
      <DatePicker
        label="Data Fim"
        value={selectedAtividade.end_date ? new Date(selectedAtividade.end_date) : null}
        onChange={(date) => {
          setSelectedAtividade({
            ...selectedAtividade,
            end_date: date ? date.toISOString() : null,
          })
        }}
      />
    </div>
    {/* Aqui renderiza o componente ArquivosAtv com o id da atividade */}
    <div className="space-x-2">
    <ArquivosAtv atividadeId={selectedAtividade.id} />
    <FeitosAtv atividadeId={selectedAtividade.id} />
    </div>
  </div>
)}

{selectedAtividade && selectedAtividade.obs_envio && (
  <div className="space-y-2">
    <label className="block text-sm font-medium">
      Observação do Envio
    </label>
    <div style={{ whiteSpace: "pre-wrap" }} className="p-2 border rounded-md text-sm max-h-40 overflow-auto">
      {selectedAtividade.obs_envio}
    </div>
  </div>
)}


<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
      <AlertDialogDescription>
        Essa ação vai apagar a atividade permanentemente. Deseja continuar?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogAction onClick={handleDeleteAtividade}>
      Sim, apagar
    </AlertDialogAction>
    <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
      Cancelar
    </AlertDialogCancel>

 


  </AlertDialogContent>
</AlertDialog>








<SheetFooter className="flex justify-center gap-4 p-4 mt-auto items-center">
  <Button
    variant="destructive"
    size="sm"
    className="w-50"
    onClick={() => setIsDeleteDialogOpen(true)}
  >
    Apagar
  </Button>

  <Button
    variant="outline"
    size="sm"
    className="w-50"
    onClick={() => setIsSheetOpen(false)}
  >
    Cancelar
  </Button>

  <Button
    variant="default"
    size="sm"
    className="w-50"
    onClick={handleOpenAlertDialog}
    disabled={isSaving}
  >
    Salvar alterações
  </Button>
</SheetFooter>


        </SheetContent>
      </Sheet>
    </div>
  )
}

export default ListAtv
