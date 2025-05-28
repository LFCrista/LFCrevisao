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
import { useSearchParams } from 'next/navigation'
import { toast } from "sonner";



interface Atividade {
  deveDestacar: boolean
  descricao: string
  id: string
  titulo: string
  start_date: string | null
  end_date: string | null
  entrega_date: string | null
  status: string
  user_id: string
  baixado: boolean
  obs_envio?: string
  justificativa?: string  // <-- adiciona isso
}

interface User {
  id: string
  name: string
}

const ListArquivados: React.FC = () => {
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
  const searchParams = useSearchParams()
  const [isUncheckDialogOpen, setIsUncheckDialogOpen] = React.useState(false); // para desmarcar checkbox
  const [isSaveDialogOpen, setIsSaveDialogOpen] = React.useState(false); // para salvar alterações
  const [atividadesComArquivoNovo, setAtividadesComArquivoNovo] = React.useState<string[]>([]);
  const [novosArquivosMap, setNovosArquivosMap] = React.useState<Set<string>>(new Set());

  

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

  const handleCheckboxChange = (atividadeId: string, checked: boolean) => {
    const atividade = atividades.find((a) => a.id === atividadeId);
    if (!atividade) return;
  
    if (atividade.baixado && !checked) {
      // O usuário está desmarcando → abrir confirmação
      setSelectedAtividadeId(atividadeId);
      setBaixadoChecked(false);
      setIsUncheckDialogOpen(true);
    } else {
      // Marca diretamente sem confirmação
      updateBaixado(atividadeId, checked);
  
      // Exibe toast apenas quando marcar como baixado
      if (checked) {
        toast.success(`${atividade.titulo} marcado como baixado`);
      }
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
    if (selectedAtividadeId !== null) {
      const atividade = atividades.find((a) => a.id === selectedAtividadeId);
      if (!atividade) return;
  
      updateBaixado(selectedAtividadeId, false);
      toast(`${atividade.titulo} desmarcado como baixado`);
      setIsUncheckDialogOpen(false);
    }
  };
  ;
  
  

const fetchAtividades = async (page: number) => {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const { data: atividadesData, error } = await supabase
    .from("atividades")
    .select("*");

  if (error) {
    console.error("Erro ao buscar atividades:", error);
    return;
  }

  // 🔍 BUSCAR arquivos não vistos por atividade e pelo admin logado
  const { data: arquivosNaoVistos, error: erroArquivos } = await supabase
    .from("new_arquivo")
    .select("atividade_id, visto")
    .eq("para", userId)  // Filtra pelos arquivos para o admin logado
    .eq("visto", false); // Filtra os arquivos que não foram vistos

  if (erroArquivos) {
    console.error("Erro ao buscar arquivos não vistos:", erroArquivos);
  }

  // Obtem IDs de atividades com arquivos não vistos
  const atividadesComArquivosNaoVistos = new Set(
    (arquivosNaoVistos || []).map((a) => a.atividade_id)
  );

  // 🔄 Enriquecer cada atividade com info se deve destacar
  let filtradas = atividadesData
    .filter((a) => a.baixado) // 👈 ESSA LINHA MOSTRA APENAS OS BAIXADOS
    .filter((a) => a.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((a) => {
      const todosArquivosVistos = (arquivosNaoVistos ?? []).filter(
  (arquivo) => arquivo.atividade_id === a.id
).length === 0;
// Verifica se não existem arquivos não vistos

      return {
        ...a,
        deveDestacar: !todosArquivosVistos, // Vai destacar se existirem arquivos não vistos
      };
    });

  if (selectedUser) {
    filtradas = filtradas.filter((a) => a.user_id === String(selectedUser.id));
  }

  // Atualizando o status das atividades
  const atividadesComStatusAtualizado = await Promise.all(
    filtradas.map(async (atividade) => {
      if (!atividade.end_date) return atividade;

      const agora = new Date();
      const dataFim = new Date(atividade.end_date);

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

  const atividadesOrdenadas = [...atividadesComStatusAtualizado].sort((a, b) => {
    if (a.baixado !== b.baixado) return a.baixado ? 1 : -1;

    const prioridadeStatus = (status: string) => {
      switch (status) {
        case "Pendente":
        case "Em Progresso":
          return 0;
        case "Atrasada":
          return 1;
        case "Concluída":
          return 2;
        default:
          return 3;
      }
    };

    const prioridadeA = prioridadeStatus(a.status);
    const prioridadeB = prioridadeStatus(b.status);
    if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;

    if (a.status === "Concluída" && b.status === "Concluída") {
      const entregaA = a.entrega_date ? new Date(a.entrega_date).getTime() : 0;
      const entregaB = b.entrega_date ? new Date(b.entrega_date).getTime() : 0;
      return entregaB - entregaA;
    }

    const endDateA = a.end_date ? new Date(a.end_date).getTime() : Infinity;
    const endDateB = b.end_date ? new Date(b.end_date).getTime() : Infinity;

    return endDateA - endDateB;
  });

  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  setAtividades(atividadesOrdenadas.slice(start, end));
  setTotalPages(Math.ceil(atividadesOrdenadas.length / ITEMS_PER_PAGE));
  setLoading(false);
};



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
    
          fetchAtividadeById()
        }
      }, [searchParams, atividades])
  
  

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
    router.push(`/admin/atividades/arquivados?atividade=${atividade.id}`)
  }
  

const handleSaveChanges = async () => {
  if (!selectedAtividade || !selectedAtividade.id) {
    console.error("Atividade não selecionada ou ID ausente.");
    alert("Atividade não selecionada ou ID ausente.");
    return;
  }

  const { id } = selectedAtividade;

  const dadosParaAtualizar = {
    titulo: selectedAtividade.titulo,
    descricao: selectedAtividade.descricao,
    // outros campos válidos da tabela 'atividades'
  };

  const visto = true;

  setIsSaving(true);

  const { error: updateAtividadeError } = await supabase
    .from('atividades')
    .update(dadosParaAtualizar)
    .eq('id', id);

  if (!updateAtividadeError) {
    const { error: updateArquivoError } = await supabase
      .from('new_arquivo')
      .update({ visto })
      .eq('atividade_id', id);

    // ✅ Atualiza o campo "baixado" no banco com o valor atual do checkbox
    await updateBaixado(id, selectedAtividade.baixado);

    setIsSaving(false);

    if (updateArquivoError) {
      console.error('Erro ao atualizar a tabela new_arquivo:', updateArquivoError);
      alert('Erro ao salvar alterações na tabela new_arquivo.');
    } else {
      setIsSheetOpen(false);
      window.location.reload();
    }
  } else {
    setIsSaving(false);
    console.error('Erro ao atualizar a tabela atividades:', updateAtividadeError);
    alert('Erro ao salvar alterações na tabela atividades.');
  }
};



  

  const handleOpenAlertDialog = () => setIsAlertDialogOpen(true); // Abre o AlertDialog
  const handleCloseAlertDialog = () => setIsAlertDialogOpen(false); // Fecha o AlertDialog

  const handleDeleteAtividade = async () => {
  if (!selectedAtividade || !selectedAtividade.id) return;

  // Deleta arquivos relacionados
  const { error: arquivosError } = await supabase
    .from("new_arquivo")
    .delete()
    .eq("atividade_id", selectedAtividade.id);

  if (arquivosError) {
    console.error("Erro ao excluir arquivos:", arquivosError.message);
    alert("Erro ao excluir arquivos da atividade.");
    return;
  }

  // Deleta a atividade
  const { error: atividadeError } = await supabase
    .from("atividades")
    .delete()
    .eq("id", selectedAtividade.id);

  if (atividadeError) {
    console.error("Erro ao excluir atividade:", atividadeError.message);
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

  const calcularAtraso = (endDate: string | null, entregaDate: string | null) => {
    if (!endDate || !entregaDate) return null;
  
    const end = new Date(endDate);
    const entrega = new Date(entregaDate);
  
    if (entrega <= end) return null;
  
    const diffMs = entrega.getTime() - end.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const dias = Math.floor(diffMin / 1440); // 1440 = 60*24
    const horas = Math.floor((diffMin % 1440) / 60);
    const minutos = diffMin % 60;
  
    let resultado = '';
    if (dias > 0) resultado += `${dias}d `;
    if (horas > 0 || dias > 0) resultado += `${horas}h `;
    resultado += `${minutos}min`;
  
    return resultado.trim();
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
  const nomeSplit = usuarioNome.split(" ");
  const nomeExibido = nomeSplit[0];

  const deveDestacar = atividade.deveDestacar;

  return (
    <TableRow
      key={atividade.id}
      className={deveDestacar ? "text-blue-400" : ""}
    >
      <TableCell
        className="cursor-pointer hover:underline flex items-center gap-2"
        onClick={() => handleTitleClick(atividade)}
      >
        {deveDestacar && (
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex size-3 rounded-full bg-sky-500"></span>
          </span>
        )}
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
  );
})}


        </TableBody>
      </Table>

       {/* AlertDialog para confirmar a desmarcação */}
       <AlertDialog open={isUncheckDialogOpen} onOpenChange={setIsUncheckDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmar desmarcação</AlertDialogTitle>
      <AlertDialogDescription>
        Tem certeza de que deseja desmarcar o checkbox de "baixado"?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogAction onClick={handleConfirmChange}>Sim, desmarcar</AlertDialogAction>
    <AlertDialogCancel onClick={() => setIsUncheckDialogOpen(false)}>Cancelar</AlertDialogCancel>
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
  if (!open) router.replace("/admin/atividades/arquivados")
}}>

        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Atividade</SheetTitle>
            <SheetDescription>Alterar os dados da atividade</SheetDescription>
          </SheetHeader>

          {selectedAtividade && (
  <div className="space-y-4 p-4 ">
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

      {/* Status da atividade */}
<div className="space-y-2">
  <label className="block text-sm font-medium">Status</label>
  <Badge variant={getBadgeVariant(selectedAtividade.status)}>
    {selectedAtividade.status}
  </Badge>
</div>

{/* Checkbox editável para "Baixado" */}
<div className="flex items-center space-x-2">
  <input
    type="checkbox"
    id="baixado"
    checked={selectedAtividade.baixado}
    onChange={(e) =>
      setSelectedAtividade({
        ...selectedAtividade,
        baixado: e.target.checked,
      })
    }
  />
  <label htmlFor="baixado" className="text-sm font-medium">
    Baixado
  </label>
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

{/* Tempo de atraso */}
{selectedAtividade?.status === "Fora de Prazo" && selectedAtividade.end_date && selectedAtividade.entrega_date && (
  <div className="space-y-2">
    <label className="block text-sm font-medium">Tempo de Atraso</label>
    <div className="p-2 border rounded-md text-sm bg-muted">
    Atraso: {calcularAtraso(selectedAtividade.end_date, selectedAtividade.entrega_date)}
    </div>
  </div>
)}

{/* Campo de justificativa */}
{selectedAtividade?.status === "Fora de Prazo" && selectedAtividade.justificativa && (
  <div className="space-y-2">
    <label htmlFor="justificativa" className="block text-sm font-medium">
      Justificativa do Atraso
    </label>
    <div
      id="justificativa"
      style={{ whiteSpace: "pre-wrap" }} 
      className="p-2 border rounded-md text-sm max-h-40 overflow-auto bg-muted"
    >
      {selectedAtividade.justificativa}
    </div>
  </div>
)}
  
  {/* Observação do envio */} 

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

export default ListArquivados
