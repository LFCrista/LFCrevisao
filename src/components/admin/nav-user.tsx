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

  function getInitials(name: string): string {
    if (typeof name !== "string" || name.trim() === "") {
      return "??"; // Ou lance erro, se preferir
    }
  
    // Remove espaços duplicados e strings vazias
    const names = name
      .trim()
      .split(" ")
      .filter((n) => n.trim() !== "");
  
    if (names.length === 0) {
      return "??";
    }
  
    const firstInitial = names[0][0]?.toUpperCase() ?? "";
    const lastInitial = names.length > 1 ? names[names.length - 1][0]?.toUpperCase() : "";
  
    return firstInitial + lastInitial;
  }
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const initialTheme = savedTheme || "light"
    setTheme(initialTheme)
    document.documentElement.setAttribute("data-theme", initialTheme)
  }, [])

 

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
              
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      
    </>
  )
}
