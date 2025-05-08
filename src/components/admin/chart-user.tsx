"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"  // Caminho do cliente do Supabase

type Atividade = {
  id: string
  user_id: string
  status: string  // Usando a coluna 'status'
}

type Props = {
  userId: string
}

export function ChartUser({ userId }: Props) {
  const [chartData, setChartData] = React.useState<{ status: string; total: number; fill: string }[]>([])
  const [noAtividades, setNoAtividades] = React.useState<boolean>(false)  // Novo estado para verificar se não há atividades

  // Definir as cores com base no status
  const statusColorMap: Record<string, string> = {
    Pendente: "#FFEB3B",  // Amarelo para Pendente
    "Em Progresso": "#2196F3",  // Azul para Em Progresso
    Concluída: "#4CAF50",  // Verde para Concluída
    Atrasada: "#F44336",
    "Fora de Prazo": "#9e34eb"  // Vermelho para Atrasada
  }

  // Definir o gráfico de configuração baseado nos status
  const chartConfig: ChartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    chartData.forEach((item, index) => {
      config[item.status] = {
        label: item.status,
        color: statusColorMap[item.status] || "#000000",  // Cor personalizada
      }
    })
    return config
  }, [chartData])

  const totalAtividades = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.total, 0)
  }, [chartData])

  React.useEffect(() => {
    async function fetchAtividades() {
      try {
        // Consulta ao Supabase para pegar as atividades filtradas pelo userId
        const { data, error } = await supabase
          .from("atividades")
          .select("*")
          .eq("user_id", userId)  // Filtra pelo user_id
          .order("created_at", { ascending: false }) // Organiza por data, se necessário

        if (error) {
          throw error
        }

        // Verificando se 'data' está vazio ou não
        if (!data || data.length === 0) {
          setNoAtividades(true)  // Setando o estado para mostrar a mensagem
          return
        }

        // Agrupar as atividades por 'status'
        const agrupado: Record<string, number> = {}
        data.forEach((item) => {
          agrupado[item.status] = (agrupado[item.status] || 0) + 1
        })

        // Formatando os dados para o gráfico
        const dadosFormatados = Object.entries(agrupado).map(([status, total], i) => ({
          status,
          total,
          fill: statusColorMap[status] || "#000000",  // Cor personalizada
        }))

        // Atualiza o estado com os dados formatados
        setChartData(dadosFormatados)
        setNoAtividades(false)  // Garantir que a mensagem de "sem atividades" seja removida caso haja atividades
      } catch (err) {
        console.error("Erro ao buscar atividades:", err)
      }
    }

    fetchAtividades()
  }, [userId])

  if (noAtividades) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Estatística do Usuário</CardTitle>
          <CardDescription>Distribuição por status</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <p className="text-center text-gray-500">Este usuário não tem atividades atribuídas.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Estatística do Usuário</CardTitle>
        <CardDescription>Distribuição por status</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="total"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalAtividades}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Atividades
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Total de atividades registradas por status
        </div>
      </CardFooter>
    </Card>
  )
}
