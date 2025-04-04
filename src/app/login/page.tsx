'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Carregar as variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Key is missing. Please check your .env.local file.')
  }

  // Inicializando o cliente do Supabase
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Verificação de login ao carregar o componente
  useEffect(() => {
    const token = localStorage.getItem('token')
    const admin = JSON.parse(localStorage.getItem('admin') || 'false')

    if (token) {
      // Redireciona baseado no tipo de usuário
      if (admin) {
        router.push('/admin')  // Se for admin
      } else {
        router.push('/feed')   // Se não for admin
      }
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Realizando o login com o Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // Obter o user_id do usuário autenticado
      const userId = data?.user?.id
      console.log('userId após autenticação:', userId)  // Log para depuração

      if (!userId) {
        setError('Usuário não encontrado.')
        return
      }

      // Buscar o id do usuário na tabela public.users com o user_id
      const { data: userData, error: userError, status } = await supabase
        .from('users')
        .select('id, name, email, admin')  // Inclui o id, name, email e admin na seleção
        .eq('user_id', userId)

      console.log('Dados do usuário encontrado:', userData)  // Log para depuração

      if (userError) {
        setError('Erro ao buscar dados do usuário: ' + userError.message)
        return
      }

      if (status === 200 && userData && userData.length === 1) {
        // Usuário encontrado com sucesso
        const user = userData[0]
        const userType = user.admin ? 'admin' : 'não admin'  // Verifica se é admin ou não

        // Salvar o id do usuário, email e admin no localStorage
        localStorage.setItem('user_id', user.id)  // Salvar o ID do usuário
        localStorage.setItem('email', user.email)  // Salvar o email do usuário
        localStorage.setItem('admin', JSON.stringify(user.admin))  // Salvar o valor de admin (true/false)
        localStorage.setItem('token', data.session?.access_token || '')  // Salvar o token de sessão

        // Redirecionamento baseado no tipo de usuário
        if (user.admin) {
          // Se for admin, redireciona para /admin
          router.push('/admin')
        } else {
          // Se não for admin, redireciona para /feed
          router.push('/feed')
        }
      } else if (userData && userData.length > 1) {
        // Se houver múltiplos registros, avisamos
        setError('Múltiplos usuários encontrados com o mesmo user_id.')
      } else {
        // Caso não tenha nenhum usuário
        setError('Usuário não encontrado na tabela users.')
      }
    } catch (err) {
      console.error('Erro durante o login:', err)
      setError('Ocorreu um erro ao tentar realizar o login. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-[#212529] flex justify-center items-center">
      <div className="bg-transparent p-8 rounded-lg max-w-sm w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-left text-white">Login</h1>
          <div className="mt-2 w-1/4 h-2 bg-[#00a830]"></div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col items-center space-y-6">
          <div className="w-full relative">
            <input
              type="email"
              id="email"
              placeholder="Digite seu email"
              className="mt-1 block w-full pl-10 pr-4 py-3 border-b-2 border-[#ffffff] bg-transparent focus:outline-none focus:border-[#00a830] placeholder-[#ffffff] focus:placeholder-[#00a830] text-white transition-all duration-300 ease-in-out"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="w-full relative">
            <input
              type="password"
              id="password"
              placeholder="Digite sua senha"
              className="mt-1 block w-full pl-10 pr-4 py-3 border-b-2 border-[#ffffff] bg-transparent focus:outline-none focus:border-[#00a830] placeholder-[#ffffff] focus:placeholder-[#00a830] text-white transition-all duration-300 ease-in-out"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-red-500 mt-2">{error}</div>}

          <button
            type="submit"
            className="w-14 h-14 flex items-center justify-center rounded-full border-2 border-[#ffffff] text-white hover:bg-[#00a830] hover:border-transparent hover:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-500 ease-in-out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
