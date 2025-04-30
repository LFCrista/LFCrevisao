'use client'

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

export type Status =
  | "Pendente"
  | "Em Progresso"
  | "Concluída"
  | "Atrasada"

const statusOptions: Status[] = [
  "Pendente",
  "Em Progresso",
  "Concluída",
  "Atrasada",
]

export function ComboboxStatus({
  onSelectStatus,
}: {
  onSelectStatus?: (status: Status | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [selectedStatus, setSelectedStatus] = React.useState<Status | null>(null)

  const handleSelect = (status: Status) => {
    setSelectedStatus(status)
    setOpen(false)
    if (onSelectStatus) onSelectStatus(status)
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
          <span className="truncate">{selectedStatus || "Selecionar status..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Buscar status..." className="h-9" />
          <CommandList>
            <CommandEmpty>Status não encontrado.</CommandEmpty>

            <CommandItem
              onSelect={() => {
                setSelectedStatus(null)
                setOpen(false)
                if (onSelectStatus) onSelectStatus(null)
              }}
              className="text-destructive"
            >
              Limpar filtro
            </CommandItem>

            <CommandGroup>
              {statusOptions.map((status) => (
                <CommandItem
                  key={status}
                  value={status}
                  onSelect={() => handleSelect(status)}
                >
                  <span className="truncate">{status}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedStatus === status ? "opacity-100" : "opacity-0"
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
