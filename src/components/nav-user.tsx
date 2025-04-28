"use client"

import { useState, useEffect, useRef } from "react"
import { Sun, Moon } from "lucide-react"


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


import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  CircleArrowRight,
  CircleX,
  X,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { createPortal } from "react-dom"
import Link from "next/link"

function getInitials(name: string): string {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Name must be a valid string");
  }

  const names = name.split(" ");
  if (names.length === 1) {
    return names[0][0].toUpperCase(); // Retorna a inicial do primeiro nome
  }
  
  return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase(); // Inicial do primeiro e último nome
}


export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
  }
}) {
  const { isMobile } = useSidebar()
  const [theme, setTheme] = useState<string>("light")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notifications, setNotifications] = useState<
    { id: string; texto: string; link: string; visto?: boolean }[]
  >([])

  const notificationRef = useRef<HTMLDivElement>(null)

  const initials = getInitials(user.name)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.clear()
      window.location.href = "/login"
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Erro ao realizar logout:", error.message)
      } else {
        console.error("Erro ao realizar logout:", error)
      }
    }
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  useEffect(() => {
    
    const savedTheme = localStorage.getItem("theme")
  if (savedTheme) {
    setTheme(savedTheme)
    document.documentElement.setAttribute("data-theme", savedTheme)
  }

    const fetchNotifications = async () => {
      const userId = localStorage.getItem("user_id")
      if (!userId) return

      const { data, error } = await supabase
        .from("notifications")
        .select("id, texto, link, visto")
        .eq("user_id", userId)

      if (error) {
        console.error("Erro ao buscar notificações:", error.message)
      } else {
        setNotifications(data || [])
      }
    }

    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ visto: true })
        .eq("id", notificationId)

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, visto: true } : n
          )
        )
      }
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const userId = localStorage.getItem("user_id")
      if (!userId) return

      const { error } = await supabase
        .from("notifications")
        .update({ visto: true })
        .eq("user_id", userId)

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, visto: true }))
        )
      }
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)

      if (!error) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        )
      }
    } catch (error) {
      console.error("Erro ao excluir notificação:", error)
    }
  }

  const handleClearNotifications = async () => {
    try {
      const userId = localStorage.getItem("user_id")
      if (!userId) return

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId)

      if (!error) {
        setNotifications([])
      }
    } catch (error) {
      console.error("Erro ao excluir todas as notificações:", error)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    
    // Atualizar o tema no estado
    setTheme(newTheme);
  
    // Salvar a escolha do tema no localStorage
    localStorage.setItem("theme", newTheme);
  
    // Atualizar o atributo do elemento <html> para aplicar o tema
    document.documentElement.setAttribute("data-theme", newTheme);
  
    // Recarregar a página para aplicar a mudança de tema imediatamente
    window.location.reload();
  };
  
  

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white">
                    {initials}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
              <DropdownMenuItem onClick={toggleTheme}>
  {theme === "light" ? <Sun /> : <Moon />}
  Mudar para {theme === "light" ? "Modo Escuro" : "Modo Claro"}
</DropdownMenuItem>
<DropdownMenuSeparator />
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={openModal}>
                  <Bell />
                  Notificações
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999]">
            <div
              className="absolute inset-0 bg-[rgba(0,0,0,0.5)]"
              onClick={closeModal}
            ></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] rounded-lg shadow-lg bg-white flex flex-col">
              {/* Header do modal */}
              <div className="flex items-center justify-between bg-blue-800 text-white px-4 py-2 rounded-t-lg">
                <h2 className="text-lg font-bold">Notificações</h2>
                <button onClick={closeModal} className="text-white hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Conteúdo do modal */}
              <div className="flex-1 overflow-y-auto p-4">
                <ul>
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="mb-4 pb-2 border-b border-gray-300 text-black flex items-center"
                    >
                      {!notification.visto && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      )}
                      <span className="flex-1">{notification.texto}</span>
                      <Link
                        href={notification.link || "#"}
                        className="text-blue-500 hover:text-blue-700 mr-2 flex items-center"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <CircleArrowRight className="w-6 h-6" />
                      </Link>
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-red-500 hover:text-red-700 flex items-center"
                      >
                        <CircleX className="w-6 h-6" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer do modal */}
              <div className="flex justify-between bg-blue-800 text-white px-4 py-2 rounded-b-lg">
              <button
  onClick={async () => {
    await handleMarkAllAsRead()
  }}
  className="bg-transparent text-white hover:text-gray-300 px-4 py-2 rounded"
>
  Ver Tudo
</button>

<AlertDialog>
  <AlertDialogTrigger asChild>
    <button className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded">
      Esvaziar
    </button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Tem certeza que deseja esvaziar?</AlertDialogTitle>
      <AlertDialogDescription>
        Essa ação não poderá ser desfeita. Todas as notificações serão excluídas permanentemente.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          await handleClearNotifications()
        }}
      >
        Confirmar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
