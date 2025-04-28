"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { supabase } from "@/lib/supabase"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Tipos de status disponíveis no banco de dados
type StatusType = "Pendente" | "Em Progresso" | "Concluída" | "Atrasada"

// Tipagem para os dados do gráfico
type ChartData = {
  month: string
  Concluída: number
  Atrasada: number
}

// Configuração de cores e labels apenas para os status "Concluída" e "Atrasada"
const chartConfig: Partial<Record<StatusType, { label: string; color: string }>> = {
  "Concluída": { label: "Concluída", color: "#22c55e" },
  "Atrasada": { label: "Atrasada", color: "#ef4444" },
}

const monthLabels = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function BarChartCardAnual() {
  // Inicializa o estado para os dados do gráfico
  const [chartData, setChartData] = useState<ChartData[]>(
    monthLabels.map((month) => ({
      month,
      "Concluída": 0,
      "Atrasada": 0,
    }))
  )

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date()
      const startOfYear = new Date(Date.UTC(now.getFullYear(), 0, 1)).toISOString()
      const endOfYear = new Date(Date.UTC(now.getFullYear() + 1, 0, 1)).toISOString()

      const { data, error } = await supabase
        .from("atividades")
        .select("status, created_at")
        .gte("created_at", startOfYear)
        .lt("created_at", endOfYear)

      if (error) {
        console.error("Erro ao buscar dados:", error)
        return
      }

      // Contabiliza as atividades por mês e status "Concluída" ou "Atrasada"
      const monthlyStatusCount = monthLabels.map((month) => ({
        month,
        "Concluída": 0,
        "Atrasada": 0,
      }))

      data.forEach((item) => {
        const date = new Date(item.created_at)
        const monthIndex = date.getUTCMonth() // Índice do mês
        const status = item.status as StatusType

        // Só contar "Concluída" e "Atrasada"
        if (status === "Concluída" || status === "Atrasada") {
          if (monthlyStatusCount[monthIndex]) {
            monthlyStatusCount[monthIndex][status]++
          }
        }
      })

      setChartData(monthlyStatusCount) // Atualizando o estado com os dados
    }

    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status das Atividades por Mês</CardTitle>
        <CardDescription>
          Ano de {new Date().getFullYear()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} height={350}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis allowDecimals={false} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />

            {/* Renderiza uma barra para os status "Concluída" e "Atrasada" */}
            {Object.keys(chartConfig).map((status) => (
              <Bar
                key={status}
                dataKey={status}
                stackId="a"
                fill={chartConfig[status as StatusType]?.color ?? "#000"}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Status anual das atividades <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Baseado na data de criação
        </div>
      </CardFooter>
    </Card>
  )
}
