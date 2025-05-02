"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  X,
  CircleArrowRight,
  CircleX,
} from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { format, parseISO, isToday, isYesterday } from "date-fns"
import { ptBR } from "date-fns/locale"

type Notification = {
  id: string
  texto: string
  link: string
  visto?: boolean
  created_at: string // A data será fornecida como string
}

type Props = {
  open: boolean
  onClose: () => void
  notifications: Notification[]
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

export function NotificationModal({
  open,
  onClose,
  notifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
}: Props) {
  if (!open) return null

  // Função para agrupar notificações por dia
  const groupByDay = (notifications: Notification[]) => {
    const sorted = [...notifications].sort((a, b) =>
      (b.created_at || "").localeCompare(a.created_at || "")
    )

    const groups: Record<string, Notification[]> = {}

    for (const notif of sorted) {
      const createdAt = notif.created_at ? parseISO(notif.created_at) : null
      let label = "Sem data"

      if (createdAt) {
        // Ajusta a data para o fuso horário UTC-3
        const localDate = new Date(createdAt.getTime() - 3 * 60 * 60 * 1000) // Subtrai 3 horas para UTC-3
        label = format(localDate, "dd/MM/yyyy", { locale: ptBR })

        if (isToday(localDate)) label = "Hoje"
        else if (isYesterday(localDate)) label = "Ontem"
      }

      if (!groups[label]) groups[label] = []
      groups[label].push(notif)
    }

    return groups
  }

  // Agrupando as notificações
  const groupedNotifications = groupByDay(notifications)

  // Função para formatar hora e minuto em UTC-3
  const formatHora = (data: string | null) => {
    if (!data) return ""
    
    // Verifica se a data existe e converte para o fuso horário UTC-3
    const parsedDate = parseISO(data)
    
    // Verifica se a data foi convertida corretamente
    if (isNaN(parsedDate.getTime())) return "Data inválida"
    
    const localDate = new Date(parsedDate.getTime()) // Subtrai 3 horas
    return format(localDate, "HH:mm", { locale: ptBR }) // Formato de hora e minuto
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
        <Card className="overflow-hidden rounded-xl border shadow-xl bg-background">
          <CardHeader className="flex items-center justify-between px-4 py-2 border-b">
            <CardTitle className="text-lg">Notificações</CardTitle>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          <CardContent className="h-[400px] overflow-y-auto px-4 py-2 space-y-4">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma notificação encontrada.</p>
            ) : (
              Object.entries(groupedNotifications).map(([dia, lista]) => (
                <div key={dia}>
                  <p className="text-xs text-muted-foreground font-semibold mb-2">{dia}</p>
                  <ul className="space-y-2">
                    {lista.map((notification) => {
                      const hora = notification.created_at
                        ? formatHora(notification.created_at)
                        : "Sem hora"

                      return (
                        <li
                          key={notification.id}
                          className="flex items-start gap-3 border-b pb-2 last:border-b-0"
                        >
                          {!notification.visto && (
                            <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground mb-1">{hora}</div>
                            <span className="text-sm leading-snug text-foreground">
                              {notification.texto}
                            </span>
                          </div>
                          <Link
                            href={notification.link || "#"}
                            className="text-primary hover:text-primary/80"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CircleArrowRight className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <CircleX className="w-5 h-5" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))
            )}
          </CardContent>

          <CardFooter className="flex justify-between items-center px-4 py-2 border-t">
            <button
              onClick={markAllAsRead}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Marcar todas como lidas
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-sm font-medium text-destructive hover:text-destructive/80">
                  Esvaziar
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá remover permanentemente todas as notificações. Isso não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAll}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>,
    document.body
  )
}
