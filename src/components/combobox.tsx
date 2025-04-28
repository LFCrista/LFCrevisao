"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"

type User = {
  id: string
  name: string
}

export function ComboboxUsers({
  onSelectUser,
}: {
  onSelectUser?: (user: User | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [users, setUsers] = React.useState<User[]>([])
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("id, name")
      if (error) {
        console.error("Erro ao buscar usuários:", error)
        return
      }
      setUsers(data)
    }

    fetchUsers()
  }, [])

  const handleSelect = (user: User) => {
    setSelectedUser(user)
    setOpen(false)
    if (onSelectUser) onSelectUser(user)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {/* Nome do usuário selecionado com corte se for grande */}
          <span className="truncate">{selectedUser?.name || "Selecionar colaborador..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Buscar colaborador..." className="h-9" />
          <CommandList>
            <CommandEmpty>Colaborador não encontrado.</CommandEmpty>

            {/* Botão para limpar seleção - agora no topo */}
            <CommandItem
              onSelect={() => {
                setSelectedUser(null)
                setOpen(false)
                if (onSelectUser) onSelectUser(null)
              }}
              className="text-destructive"
            >
              Limpar filtro
            </CommandItem>

            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.name}
                  onSelect={() => handleSelect(user)}
                >
                  {/* Nome do usuário na lista com corte */}
                  <span className="truncate">{user.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
