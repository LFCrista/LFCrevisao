"use client"

import { ReactNode, useEffect, useState } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { AppSidebar } from "@/components/admin/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { NotificationModal } from "@/components/admin/notification-modal"
import { ModeToggle } from "@/components/mode-toggle";
import { Bell } from "lucide-react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"
import { ThemeProvider } from "@/components/theme-provider"

// Fontes
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notifications, setNotifications] = useState<
    { id: string; texto: string; link: string; visto?: boolean; created_at: string }[]
  >([])

  useEffect(() => {


    const fetchNotifications = async () => {
      const userId = localStorage.getItem("user_id")
      if (!userId) return

      const { data, error } = await supabase
        .from("notifications")
        .select("id, texto, link, visto, created_at")
        .eq("user_id", userId)

      if (error) {
        console.error("Erro ao buscar notificações:", error.message)
      } else {
        setNotifications(data || [])
      }
    }

    fetchNotifications()
  }, [])

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ visto: true })
      .eq("id", notificationId)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, visto: true } : n))
      )
    }
  }

  const handleMarkAllAsRead = async () => {
    const userId = localStorage.getItem("user_id")
    if (!userId) return

    const { error } = await supabase
      .from("notifications")
      .update({ visto: true })
      .eq("user_id", userId)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, visto: true })))
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    }
  }

  const handleClearNotifications = async () => {
    const userId = localStorage.getItem("user_id")
    if (!userId) return

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)

    if (!error) {
      setNotifications([])
    }
  }

  return (
    
    <html lang="en" suppressHydrationWarning>
    <head />
    <body>
    <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 justify-between">
            
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />
              
              
                  <div className="relative cursor-pointer" onClick={openModal}>
                    <Bell className="w-4.5" />
                    {notifications.some((n) => !n.visto) && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white font-bold">
                        {notifications.filter((n) => !n.visto).length}
                      </span>
                    )}
                  </div>
                </div>
                <div className="gap-2 px-4">
                <ModeToggle />
                </div>
                
              </div>
          </header>
         
          {children}
          
        </SidebarInset>
      </SidebarProvider>

      {isModalOpen && (
        <NotificationModal
          open={isModalOpen}
          onClose={closeModal}
          notifications={notifications}
          markAsRead={handleMarkAsRead}
          markAllAsRead={handleMarkAllAsRead}
          deleteNotification={handleDeleteNotification}
          clearAll={handleClearNotifications}
        />
      )}
      
    </div>
    </ThemeProvider>
    </body>
    </html>
  )
}
