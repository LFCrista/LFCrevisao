'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

type User = {
  email: string
  admin: boolean
} | null

const Header = () => {
  const [notifications, setNotifications] = useState(5)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<User>(null)
  const router = useRouter()

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      // Pegando o usuário autenticado diretamente do Supabase Auth
      const { data: { user: loggedInUser } } = await supabase.auth.getUser()

      if (loggedInUser) {
        setUser({
          email: loggedInUser.email ?? '',
          admin: loggedInUser.role === 'admin', // Aqui você pode verificar o papel do usuário, dependendo da sua implementação
        })
      } else {
        console.log("Usuário não autenticado")
        router.push('/login') // Redireciona para a página de login se o usuário não estiver logado
      }
    }

    fetchUser()

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside)
    } else {
      document.removeEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [router, isMenuOpen])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Erro ao tentar fazer logout:", error.message)
      } else {
        // Remove todos os dados do localStorage
        localStorage.clear()

        // Redefine o estado do usuário
        setUser(null)

        // Redireciona para a página de login
        router.push('/login') 
      }
    } catch (error) {
      console.error("Erro ao realizar logout:", error)
    }
  }

  return (
    <header className="bg-[#212529] text-white p-4 flex items-center justify-between">
      <div className="cursor-pointer mr-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-8 w-8"
          strokeWidth="2"
          style={{ color: '#00a830' }}
          onClick={toggleMenu}
        >
          <path
            fillRule="evenodd"
            d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div className="text-xl font-bold flex-1 text-left text-white">MyApp</div>

      <div className="flex space-x-4">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
            style={{ color: '#00a830' }}
          >
            <path
              fillRule="evenodd"
              d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z"
              clipRule="evenodd"
            />
          </svg>
          {notifications > 0 && (
            <div className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
              {notifications}
            </div>
          )}
        </div>
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
            style={{ color: '#00a830' }}
          >
            <path
              fillRule="evenodd"
              d="M5.337 21.718a6.707 6.707 0 0 1-.533-.074.75.75 0 0 1-.44-1.223 3.73 3.73 0 0 0 .814-1.686c.023-.115-.022-.317-.254-.543C3.274 16.587 2.25 14.41 2.25 12c0-5.03 4.428-9 9.75-9s9.75 3.97 9.75 9c0 5.03-4.428 9-9.75 9-.833 0-1.643-.097-2.417-.279a6.721 6.721 0 0 1-4.246.997Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-50">
            <motion.div
              ref={menuRef}
              initial={{ x: '-100%' }} // Início fora da tela
              animate={{ x: 0 }} // Ao abrir, vai para x: 0
              exit={{ x: '-100%' }} // Ao fechar, vai para a posição inicial (-100%)
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 w-64 bg-[#212529] text-white p-4 h-full z-50"
            >
              <div className="flex flex-col space-y-4">
                {user ? (
                  <>
                    <div className="text-lg font-semibold">Email: {user.email}</div>
                    <div className="text-sm">{user.admin ? 'Admin' : 'Revisor'}</div>
                    <button
                      onClick={handleLogout}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="text-lg font-semibold">Usuário não logado</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header
