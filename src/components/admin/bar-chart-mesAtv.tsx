"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Correspondência exata com os nomes do banco
const chartConfig = {
  "Pendente": { label: "Pendente", color: "#facc15" },
  "Em Progresso": { label: "Em Progresso", color: "#3b82f6" },
  "Concluída": { label: "Concluída", color: "#22c55e" },
  "Atrasada": { label: "Atrasada", color: "#ef4444" },
  "Fora de Prazo": { label: "Fora de Prazo", color: "#9e34eb" }, // Adicionando o status "Fora de Prazo"
} satisfies ChartConfig

export function BarChartCardMesAtv() {
  const [chartData, setChartData] = useState<
    { status: string; count: number; fill: string }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
      const firstDayNextMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1)).toISOString();

      const { data, error } = await supabase
        .from("atividades")
        .select("status, created_at")
        .gte("created_at", firstDayOfMonth)
        .lt("created_at", firstDayNextMonth);

      if (error) {
        console.error("Erro ao buscar dados:", error);
        return;
      }

      // Inicia contadores zerados
      const statusCount: Record<string, number> = {
        "Pendente": 0,
        "Em Progresso": 0,
        "Concluída": 0,
        "Atrasada": 0,
        "Fora de Prazo": 0, // Adicionando o status "Fora de Prazo"
      };

      // Conta as atividades criadas no mês por status atual
      data.forEach((item) => {
        if (statusCount[item.status] !== undefined) {
          statusCount[item.status]++;
        }
      });

      // Formata os dados pro gráfico
      const formatted = Object.entries(statusCount).map(([status, count]) => ({
        status,
        count,
        fill: chartConfig[status as keyof typeof chartConfig].color,
      }));

      setChartData(formatted);
    };

    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades Criadas - Mês Atual</CardTitle>
        <CardDescription>
          {new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ left: 0 }}
          >
            <YAxis
              dataKey="status"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={140} // margem suficiente pros nomes longos
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label
              }
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Dados do mês atual <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Filtrado por data de criação (UTC)
        </div>
      </CardFooter>
    </Card>
  )
}
