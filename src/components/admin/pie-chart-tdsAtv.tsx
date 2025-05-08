"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import { supabase } from "@/lib/supabase";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function PieChartCardTdsAtv() {
  const [chartData, setChartData] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const { data, error } = await supabase
          .from("atividades")
          .select("status");

        if (error) throw error;

        let pendente = 0;
        let emProgresso = 0;
        let concluida = 0;
        let atrasada = 0;
        let foraDePrazo = 0; // Adicionando a variável para "Fora de Prazo"

        data.forEach((atividade) => {
          switch (atividade.status) {
            case "Pendente":
              pendente++;
              break;
            case "Em Progresso":
              emProgresso++;
              break;
            case "Concluída":
              concluida++;
              break;
            case "Atrasada":
              atrasada++;
              break;
            case "Fora de Prazo":
              foraDePrazo++;
              break; // Adicionando o caso para "Fora de Prazo"

          }
        });

        const formattedData = [
          { name: "Pendente", value: pendente, fill: "#facc15" },
          { name: "Em Progresso", value: emProgresso, fill: "#3b82f6" },
          { name: "Concluída", value: concluida, fill: "#22c55e" },
          { name: "Atrasada", value: atrasada, fill: "#ef4444" },
          { name: "Fora de Prazo", value:foraDePrazo , fill: "#9e34eb" }, // Adicionando a cor para "Fora de Prazo"
        ];

        setChartData(formattedData);
        setTotalVisitors(
          pendente + emProgresso + concluida + atrasada
        );
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados do Supabase:", error);
      }
    };

    fetchAtividades();
  }, []);

  if (loading) return <div>Carregando gráfico...</div>;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Visão geral</CardTitle>
        <CardDescription>Status das Atividades</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={{ pie: { label: "Pie Chart", color: "#3b82f6" } }}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
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
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Atividades
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        
        <div className="leading-none text-muted-foreground">
          Todas as Atividades criadas
        </div>
      </CardFooter>
    </Card>
  );
}
