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

// Tipagem para as atividades
type Atividade = {
  id: number
  titulo: string
  start_date: string
  user_id: number // ID do revisor (associado ao usuário)
}

type User = {
  id: number
  name: string // Nome do revisor
}

export function TableUltimos() {
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [users, setUsers] = useState<{ [key: number]: string }>({}) // Para armazenar os nomes dos revisores, indexados pelo ID

  // Hook para buscar as 5 últimas atividades
  useEffect(() => {
    const fetchUltimasAtividades = async () => {
      // Buscando as últimas 5 atividades
      const { data: atividadesData, error: atividadesError } = await supabase
        .from("atividades")
        .select("id, titulo, start_date, user_id")
        .order("start_date", { ascending: false }) // Ordenando por start_date da mais recente para a mais antiga
        .limit(10)

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

    fetchUltimasAtividades()
  }, [])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Data de Início</TableHead>
          <TableHead>Revisor(a)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {atividades.map((atividade) => (
          <TableRow key={atividade.id}>
            <TableCell>{atividade.titulo}</TableCell>
            <TableCell>{new Date(atividade.start_date).toLocaleString()}</TableCell>
            <TableCell>{users[atividade.user_id]}</TableCell> {/* Exibindo o nome do revisor */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
