'use client'

import { useState, useEffect } from 'react'
import Header from "../../components/Header"
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const FeedPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [tasksPending, setTasksPending] = useState<any[]>([]) // Para armazenar as tarefas "Pendentes"
  const [tasksCompleted, setTasksCompleted] = useState<any[]>([]) // Para armazenar as tarefas "Concluídas"
  const [tasksLate, setTasksLate] = useState<any[]>([]) // Para armazenar as tarefas "Atrasadas"
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const userId = localStorage.getItem('user_id')

      if (!userId) {
        setIsAuthenticated(false)
        router.push('/login') // Redireciona para o login caso não tenha user_id no localStorage
      } else {
        fetchTasks(userId) // Passa o user_id do localStorage para pegar as atividades
      }
    }

    checkAuth()
  }, [router])

  // Função para buscar as tarefas do usuário logado usando o user_id do localStorage
  const fetchTasks = async (userId: string) => {
    try {
      // Filtra as atividades com base no user_id armazenado no localStorage
      const { data: todoTasks, error: todoError } = await supabase
        .from('atividades')
        .select('*')
        .eq('user_id', userId)
        .eq('concluida', false) // Tarefas que ainda não foram concluídas

      if (todoError) throw todoError
      setTasksPending(todoTasks)

      const { data: completedTasks, error: completedError } = await supabase
        .from('atividades')
        .select('*')
        .eq('user_id', userId)
        .eq('concluida', true) // Tarefas que foram concluídas

      if (completedError) throw completedError
      setTasksCompleted(completedTasks)

      // Buscar tarefas atrasadas (onde a data de término passou)
      const currentDate = new Date()

      // Filtra tarefas pendentes que ainda não começaram ou que já passaram
      const pendingTasks = todoTasks.filter((task) => {
        const startDate = new Date(task.start_date)
        const endDate = new Date(task.end_date)
        return startDate <= currentDate && endDate >= currentDate // Tarefas que estão dentro do intervalo de tempo
      })

      setTasksPending(pendingTasks)

      // Buscar tarefas atrasadas (onde a data de término passou)
      const lateTasks = todoTasks.filter((task) => {
        const endDate = new Date(task.end_date)
        return endDate < currentDate // Tarefas que passaram do prazo
      })
      setTasksLate(lateTasks)

    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
    }
  }

  // Função para redirecionar para a página de detalhes da tarefa
  const handleTaskClick = (taskId: string) => {
    router.push(`/feed/${taskId}`) // Redireciona para a URL da tarefa específica
  }

  // Função para calcular o tempo restante
  const calculateRemainingTime = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const timeDiff = end.getTime() - now.getTime()

    if (timeDiff <= 0) return 'Tarefa expirada'

    const days = Math.floor(timeDiff / (1000 * 3600 * 24)) // dias restantes
    const hours = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600)) // horas restantes
    const minutes = Math.floor((timeDiff % (1000 * 3600)) / (1000 * 60)) // minutos restantes

    // Caso a tarefa tenha menos de 1 minuto, exibe "Menos de 1 minuto"
    if (timeDiff < 60000) return 'Menos de 1 minuto'

    let remainingTime = ''
    if (days > 0) remainingTime += `${days} dias `
    if (hours > 0) remainingTime += `${hours}h `
    if (minutes > 0) remainingTime += `${minutes}m`

    return remainingTime.trim()
  }

  // Função para verificar se o tempo restante é menor que 1 hora
  const isLessThanOneHour = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const timeDiff = end.getTime() - now.getTime()

    // Se o tempo restante for menor que 1 hora (3600000 ms), retorna true
    return timeDiff < 3600000
  }

  if (!isAuthenticated) {
    return (
      <div className="error-page">
        <p className="error-message">Você não está autenticado. Por favor, faça login.</p>
      </div>
    )
  }

  return (
    <div className="feed-page bg-gray-100 min-h-screen flex flex-col">
      <Header />

      <div className="content-container p-6 flex-grow">
        <h2 className="text-3xl font-semibold text-center mb-6">Bem-vindo ao Feed!</h2>

        {/* Tarefas Pendentes (somente pendentes, sem atrasadas) */}
        <div className="tasks-section mb-8">
          <h3 className="text-2xl font-semibold inline-block mb-4 border-b-4 border-yellow-500">Pendentes</h3>
          <div className="tasks-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-start">
            {tasksPending.length > 0 ? (
              tasksPending.map((task) => (
                <div
                  key={task.id}
                  className="task-card bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-200 transition-all duration-300 w-full h-64 flex flex-col items-center justify-center"
                  style={{ boxShadow: '4px 4px 0 rgba(255, 221, 51, 0.6)' }} // Sombra amarela sem desfoque (direita e para baixo)
                  onClick={() => handleTaskClick(task.id)}
                >
                  <h4 className="text-lg font-semibold text-center mb-2">{task.titulo}</h4>
                  <p className="text-sm text-center text-gray-600">{task.descricao}</p>
                  <p className={`text-sm text-center mt-4 ${isLessThanOneHour(task.end_date) ? 'text-red-500' : 'text-yellow-500'}`}>
                    {calculateRemainingTime(task.end_date)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Não há tarefas pendentes.</p>
            )}
          </div>
        </div>

        {/* Tarefas Atrasadas */}
        <div className="tasks-section mb-8">
          <h3 className="text-2xl font-semibold inline-block mb-4 border-b-4 border-red-500">Atrasadas</h3>
          <div className="tasks-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-start">
            {tasksLate.length > 0 ? (
              tasksLate.map((task) => (
                <div
                  key={task.id}
                  className="task-card bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-200 transition-all duration-300 w-full h-64 flex flex-col items-center justify-center"
                  style={{ boxShadow: '4px 4px 0 rgba(255, 99, 71, 0.6)' }} // Sombra vermelha sem desfoque (direita e para baixo)
                  onClick={() => handleTaskClick(task.id)}
                >
                  <h4 className="text-lg font-semibold text-center mb-2">{task.titulo}</h4>
                  <p className="text-sm text-center text-gray-600">{task.descricao}</p>
                  <p className="text-sm text-center mt-4 text-red-500">
                    Atrasada
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Não há tarefas atrasadas.</p>
            )}
          </div>
        </div>

        {/* Tarefas Concluídas */}
        <div className="tasks-section">
          <h3 className="text-2xl font-semibold inline-block mb-4 border-b-4 border-green-500">Concluídas</h3>
          <div className="tasks-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-start">
            {tasksCompleted.length > 0 ? (
              tasksCompleted.map((task) => (
                <div
                  key={task.id}
                  className="task-card bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-200 transition-all duration-300 w-full h-64 flex flex-col items-center justify-center"
                  style={{ boxShadow: '4px 4px 0 rgba(34, 197, 94, 0.6)' }} // Sombra verde sem desfoque (direita e para baixo)
                  onClick={() => handleTaskClick(task.id)}
                >
                  <h4 className="text-lg font-semibold text-center mb-2">{task.titulo}</h4>
                  <p className="text-sm text-center text-gray-600">{task.descricao}</p>
                  <p className="text-sm text-center text-green-500 mt-4">Tarefa concluída</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Não há tarefas concluídas.</p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .feed-page {
          background-color: #f5f5f5;
        }

        .content-container {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .tasks-section {
          width: 100%;
        }

        .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .task-card {
          background-color: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          width: 100%;
          height: 16rem;
          transition: transform 0.3s ease, background-color 0.3s;
        }

        .task-card:hover {
          background-color: #f9fafb;
          transform: scale(1.05); /* Aplica o zoom ao passar o mouse */
        }

        .task-card h4 {
          font-size: 1.2rem;
          font-weight: bold;
        }

        .task-card p {
          font-size: 0.875rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  )
}

export default FeedPage
