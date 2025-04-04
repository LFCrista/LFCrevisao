// components/AtividadesChart.tsx
import React from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

// Registrando os componentes do Chart.js necessários
ChartJS.register(ArcElement, Tooltip, Legend);

type AtividadesChartProps = {
  atividades: any[]
  width?: number // Largura personalizada do gráfico (opcional)
  height?: number // Altura personalizada do gráfico (opcional)
}

const AtividadesChart: React.FC<AtividadesChartProps> = ({ atividades, width = 200, height = 200 }) => {

  const getChartData = () => {
    const completed = atividades.filter(atividade => atividade.concluida).length;
    const overdue = atividades.filter(atividade => !atividade.concluida && new Date(atividade.end_date) < new Date()).length;

    const total = completed + overdue;
    const remaining = total > 0 ? total : 1; // Garantir que o total não seja zero

    return {
      labels: ['Concluídas', 'Atrasadas'],
      datasets: [{
        data: [completed, overdue],
        backgroundColor: ['#4CAF50', '#F44336'],
        hoverBackgroundColor: ['#45a049', '#e53935'],
      }],
    };
  };

  return (
    <div className="mb-6">
      <div className="flex justify-center" style={{ width: '100%', height: 'auto' }}>
        <Pie 
          data={getChartData()} 
          options={{ 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
            },
          }} 
          width={width}  // Largura do gráfico
          height={height} // Altura do gráfico
        />
      </div>
    </div>
  );
}

export default AtividadesChart;
