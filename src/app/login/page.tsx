'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { LoginForm } from '@/components/admin/login-form'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Key is missing. Please check your .env.local file.')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const admin = JSON.parse(localStorage.getItem('admin') || 'false')

    if (token) {
      if (admin) {
        router.push('/admin')
      } else {
        router.push('/feed')
      }
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      const userId = data?.user?.id

      if (!userId) {
        setError('Usuário não encontrado.')
        return
      }

      const { data: userData, error: userError, status } = await supabase
        .from('users')
        .select('id, name, email, admin')
        .eq('user_id', userId)

      if (userError) {
        setError('Erro ao buscar dados do usuário: ' + userError.message)
        return
      }

      if (status === 200 && userData && userData.length === 1) {
        const user = userData[0]

        localStorage.setItem('user_id', user.id)
        localStorage.setItem('email', user.email)
        localStorage.setItem('admin', JSON.stringify(user.admin))
        localStorage.setItem('token', data.session?.access_token || '')

        if (user.admin) {
          router.push('/admin')
        } else {
          router.push('/feed')
        }
      } else if (userData && userData.length > 1) {
        setError('Múltiplos usuários encontrados com o mesmo user_id.')
      } else {
        setError('Usuário não encontrado na tabela users.')
      }
    } catch (err) {
      console.error('Erro durante o login:', err)
      setError('Ocorreu um erro ao tentar realizar o login. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="bg-transparent p-8 rounded-lg max-w-sm w-full">
        <LoginForm
          className="text-white"
          onSubmit={handleLogin}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          error={error}
        />
      </div>
    </div>
  )
}
