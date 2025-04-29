"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { ChartUser } from "@/components/admin/chart-user"  // Importando o gráfico

interface User {
  id: string
  name: string
  email: string
  created_at: string
  admin: boolean
}

const TableColab: React.FC = () => {
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [totalPages, setTotalPages] = React.useState<number>(1)
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [filteredUsers, setFilteredUsers] = React.useState<User[]>([])
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState<boolean>(false)

  const USERS_PER_PAGE = 10 // Limite de 10 usuários por página

  // Função para buscar os usuários da tabela "users"
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error, count } = await supabase
        .from("users")
        .select("id, name, email, created_at, admin", { count: "exact" })

      if (error) {
        setError(error.message)
      } else {
        setUsers(data ?? [])
        setTotalPages(Math.ceil((count ?? 0) / USERS_PER_PAGE))
      }
    } catch (err: any) {
      setError("Erro ao carregar dados dos usuários.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Função para filtrar e aplicar paginação nos usuários
  const applyFiltersAndPagination = () => {
    // Ordena os usuários para mostrar colaboradores primeiro
    const sortedUsers = [...users].sort((a, b) => {
      if (a.admin === b.admin) return 0
      return a.admin ? 1 : -1
    })

    // Filtra os usuários pelo nome
    const filtered = sortedUsers.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    setFilteredUsers(filtered)

    // Atualiza o total de páginas com base no número de usuários filtrados
    setTotalPages(Math.ceil(filtered.length / USERS_PER_PAGE))
  }

  React.useEffect(() => {
    fetchUsers()
  }, [])

  React.useEffect(() => {
    applyFiltersAndPagination()
  }, [users, searchTerm]) // Aplica filtros sempre que os dados ou a busca mudarem

  // Função para carregar a página com base na paginação
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  )

  // Função para realizar a busca
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Função para abrir o menu lateral com as informações do usuário
  const openUserSheet = (user: User) => {
    setSelectedUser(user)
    setIsSheetOpen(true)
  }

  const closeUserSheet = () => {
    setIsSheetOpen(false)
  }

  if (loading) {
    return <p>Carregando...</p>
  }

  if (error) {
    return <p>Erro: {error}</p>
  }

  return (
    <div>
      {/* Barra de pesquisa */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nome"
          value={searchTerm}
          onChange={handleSearch}
          className="p-2 border rounded-md w-full"
        />
      </div>

      {/* Tabela de usuários */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Cargo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedUsers.map((user) => (
            <TableRow key={user.id} onClick={() => openUserSheet(user)}>
              <TableCell>
                <span
                  className="cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation() // Impede que o click na célula dispare o evento de linha
                    openUserSheet(user)
                  }}
                >
                  {user.name}
                </span>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.admin ? (
                  <Badge variant="secondary">Admin</Badge>
                ) : (
                  <Badge variant="outline">Colaborador(a)</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Paginação */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            />
          </PaginationItem>

          {/* Páginas numeradas */}
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Sheet - Menu Lateral com Informações do Usuário */}
      {selectedUser && (
        <Sheet open={isSheetOpen} onOpenChange={closeUserSheet}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{selectedUser.name}</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <p>Email: {selectedUser.email}</p>
              <p>Cargo: {selectedUser.admin ? "Admin" : "Colaborador(a)"}</p>
              <p>Criado em: {new Date(selectedUser.created_at).toLocaleDateString()}</p>
            </div>

            {/* Adicionando o gráfico de atividades do usuário */}
            <div className="p-4">
              <ChartUser userId={selectedUser.id} />
            </div>

            <SheetClose />
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

export default TableColab
