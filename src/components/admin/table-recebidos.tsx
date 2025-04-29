"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table" // Importando os componentes da tabela
import { Badge } from "@/components/ui/badge" // Importando o componente de badge para as tags

// Tipagem para as atividades
type Atividade = {
  id: number
  titulo: string
  entrega_date: string | null // Agora permite null
  end_date: string | null // Data final para determinar se está atrasada
  user_id: number // ID do revisor (associado ao usuário)
  status: string // Status da atividade (ex: "Em Progresso", "Concluída", "Atrasada")
}

type User = {
  id: number
  name: string // Nome do revisor
}

// Tipos válidos para o `variant` do Badge
type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

export function TableRecebidos() {
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [users, setUsers] = useState<{ [key: number]: string }>({}) // Para armazenar os nomes dos revisores, indexados pelo ID

  // Hook para buscar as atividades com entrega_date válido
  useEffect(() => {
    const fetchAtividades = async () => {
      // Buscando atividades com entrega_date válido
      const { data: atividadesData, error: atividadesError } = await supabase
        .from("atividades")
        .select("id, titulo, entrega_date, end_date, user_id, status")
        .not("entrega_date", "is", null) // Filtra atividades com entrega_date não nulo
        .order("entrega_date", { ascending: false })
        .limit(10)
 // Ordena pela entrega_date mais recente para a mais antiga

      if (atividadesError) {
        console.error("Erro ao buscar atividades:", atividadesError)
        return
      }

      // Buscando os nomes dos usuários (revisores)
      const userIds = atividadesData.map((atividade: Atividade) => atividade.user_id)
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name")
        .in("id", userIds)

      if (usersError) {
        console.error("Erro ao buscar usuários:", usersError)
        return
      }

      // Mapeando os dados de usuários para facilitar o acesso pelo ID
      const usersMap = usersData.reduce<{ [key: number]: string }>((acc, user: User) => {
        acc[user.id] = user.name
        return acc
      }, {})

      // Atualizando o estado com as atividades e os nomes dos revisores
      setAtividades(atividadesData)
      setUsers(usersMap)
    }

    fetchAtividades()
  }, [])

  // Função para mapear o status para o Badge
  const getBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case "Concluída":
        return "default" // Concluída pode ser verde ou neutra
      case "Em Progresso":
        return "secondary" // Em progresso pode ser azul
      case "Atrasada":
        return "destructive" // Atrasada será vermelha
      default:
        return "outline" // Status indefinido, coloca um estilo de contorno
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Data de Entrega</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Revisor(a)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {atividades.map((atividade) => {
          const badgeVariant = getBadgeVariant(atividade.status) // Pegando o variant com base no status
          return (
            <TableRow key={atividade.id}>
              <TableCell>{atividade.titulo}</TableCell>
              <TableCell>
                {atividade.entrega_date
                  ? new Date(atividade.entrega_date).toLocaleString()
                  : "Pendente"}
              </TableCell>
              <TableCell>
                <Badge variant={badgeVariant}>{atividade.status}</Badge>
              </TableCell>
              <TableCell>{users[atividade.user_id]}</TableCell> {/* Exibindo o nome do revisor */}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
