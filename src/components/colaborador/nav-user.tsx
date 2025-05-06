"use client"

import {
  LogOut,
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





export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
  }
}) {
  const { isMobile } = useSidebar()



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
