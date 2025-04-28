"use client" // Certificando-se de que este componente é um componente de cliente

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock as ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  label: string
  value: Date | null
  onChange: (date: Date | null) => void
  className?: string;
}

export function DatePicker({ label, value, onChange }: DatePickerProps) {
  const [time, setTime] = React.useState<string>("") // Hora selecionada

  // Ao carregar o componente, define automaticamente o horário atual
  React.useEffect(() => {
    if (value) {
      const currentTime = format(value, "HH:mm")
      setTime(currentTime)
    } else {
      // Se não houver valor, usa o horário atual
      const currentTime = format(new Date(), "HH:mm")
      setTime(currentTime)
    }
  }, [value])

  // Função para lidar com a mudança de hora
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTime(event.target.value)
    if (value) {
      const newDate = new Date(value)
      const [hours, minutes] = event.target.value.split(":").map(Number)
      newDate.setHours(hours, minutes)
      onChange(newDate)
    }
  }

  // Função para formatar e exibir a data e hora
  const handleDateTimeDisplay = () => {
    if (value) {
      const formattedDate = format(value, "PPP")
      return `${formattedDate} ${time}`
    }
    return "Pick a date"
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {handleDateTimeDisplay()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="space-y-4 p-4">
          {/* Calendário */}
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(day) => {
              if (day) {
                const updatedDate = new Date(day)
                // Atualiza a hora junto com a data, mantendo o valor de hora atual
                if (time) {
                  const [hours, minutes] = time.split(":").map(Number)
                  updatedDate.setHours(hours, minutes)
                }
                onChange(updatedDate)
              }
            }}
            
          />

          {/* Seleção de hora */}
          <div className="flex items-center space-x-2 mt-4">
            <ClockIcon className="h-4 w-4" />
            <Input
              type="time"
              value={time}
              onChange={handleTimeChange}
              className="w-full"
              placeholder="Pick a time"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
