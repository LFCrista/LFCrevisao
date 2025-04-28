"use client"

import { useState } from "react"
import { PieChartCardTdsAtv } from "@/components/pie-chart-tdsAtv";
import { BarChartCardMesAtv } from "@/components/bar-chart-mesAtv"; 
import { BarChartCardAnual } from "@/components/bar-chart-anual";// ajuste o path se precisar
import { TableUltimos } from "@/components/table-ultimos";
import { TableRecebidos } from "@/components/table-recebidos";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent, SelectGroup } from "@/components/ui/select"
import { withAuth } from '@/lib/auth'

function Dashboard() {

  const [selectedTable, setSelectedTable] = useState<string>("ultimos")

  const handleSelectChange = (value: string) => {
    setSelectedTable(value)
  }

  return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <PieChartCardTdsAtv />
            <BarChartCardMesAtv />
            <BarChartCardAnual />
          </div>
          {/* Seletor de Tabela */}
          <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Exibir Tabela</h2>
              <Select onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Tabela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultimos">Últimos Enviados</SelectItem>
                  <SelectItem value="recebidos">Atualizações</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exibindo a tabela selecionada */}
            {selectedTable === "ultimos" && (
              <div>
                <h3 className="text-xl font-bold">Últimos Enviados</h3>
                <TableUltimos />
              </div>
            )}

            {selectedTable === "recebidos" && (
              <div>
                <h3 className="text-xl font-bold">Atualizações</h3>
                <TableRecebidos />
              </div>
            )}
        </div>
  )
}

export default withAuth(Dashboard);
