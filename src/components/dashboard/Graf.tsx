'use client';

import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { supabase } from '../../lib/supabase';

// Registra os elementos do gráfico
ChartJS.register(ArcElement, Tooltip, Legend);

const Graf = () => {
  const [dataGrafico, setDataGrafico] = useState([0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const { data, error } = await supabase
          .from('atividades')
          .select('status');

        if (error) throw error;

        let pendente = 0;
        let emProgresso = 0;
        let concluida = 0;
        let atrasada = 0;

        data.forEach((atividade) => {
          switch (atividade.status) {
            case 'Pendente':
              pendente++;
              break;
            case 'Em Progresso':
              emProgresso++;
              break;
            case 'Concluída':
              concluida++;
              break;
            case 'Atrasada':
              atrasada++;
              break;
          }
        });

        setDataGrafico([pendente, emProgresso, concluida, atrasada]);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar dados do Supabase:', error);
      }
    };

    fetchAtividades();
  }, []);

  if (loading) return <div>Carregando gráfico...</div>;

  const data = {
    labels: ['Pendente', 'Em Progresso', 'Concluída', 'Atrasada'],
    datasets: [
      {
        data: dataGrafico,
        backgroundColor: ['#facc15', '#3b82f6', '#22c55e', '#ef4444'],
        borderColor: ['#facc15', '#3b82f6', '#22c55e', '#ef4444'],
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            return `${tooltipItem.label}: ${tooltipItem.raw}`;
          },
        },
      },
      legend: {
        labels: {
          font: {
            size: 14,
            weight: 'bold' as const,
          },
          usePointStyle: true,
        },
      },
    },
    aspectRatio: 1,
  };

  return (
    <div style={{ maxWidth: '250px', margin: '0 auto' }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default Graf;
