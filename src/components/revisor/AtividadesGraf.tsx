// components/AtividadesChart.tsx
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type AtividadesChartProps = {
  atividades: any[];
  width?: number;
  height?: number;
};

type StatusTipo = 'Pendente' | 'Em Progresso' | 'Concluída' | 'Atrasada';

const AtividadesChart: React.FC<AtividadesChartProps> = ({ atividades, width = 500, height = 500 }) => {
  const getChartData = () => {
    const statusContagem: Record<StatusTipo, number> = {
      'Pendente': 0,
      'Em Progresso': 0,
      'Concluída': 0,
      'Atrasada': 0,
    };

    atividades.forEach((atividade) => {
      const status = atividade.status as StatusTipo;
      if (status in statusContagem) {
        statusContagem[status]++;
      }
    });

    return {
      labels: ['Pendente', 'Em Progresso', 'Concluída', 'Atrasada'],
      datasets: [
        {
          data: [
            statusContagem['Pendente'],
            statusContagem['Em Progresso'],
            statusContagem['Concluída'],
            statusContagem['Atrasada'],
          ],
          backgroundColor: ['#FFC107', '#2196F3', '#4CAF50', '#F44336'],
          hoverBackgroundColor: ['#ffca2c', '#1976D2', '#45a049', '#e53935'],
        },
      ],
    };
  };

  return (
    <div className="mb-6 flex justify-center">
      <div style={{ width: `${width}px`, height: `${height}px` }}>
        <Pie
          data={getChartData()}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  font: {
                    size: 16,
                    weight: 'bold',
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default AtividadesChart;
