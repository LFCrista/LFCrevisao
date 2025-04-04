'use client'; // Marca este arquivo como componente de cliente

import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { supabase } from '../../lib/supabase'; // Importando a configuração do Supabase

// Registrando os elementos necessários do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const Graf = () => {
  const [dataGrafico, setDataGrafico] = useState([0, 0, 0]); // Estado para armazenar as quantidades de atividades
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Função para buscar as atividades do Supabase
    const fetchAtividades = async () => {
      try {
        const { data, error } = await supabase
          .from('atividades')
          .select('concluida, end_date');

        if (error) {
          throw error;
        }

        // Contadores para as cores
        let concluido = 0;
        let emAndamento = 0;
        let atrasado = 0;

        // Iterando sobre as atividades
        data.forEach((atividade) => {
          const isConcluida = atividade.concluida;
          const isAtrasada = new Date(atividade.end_date) < new Date();
          
          if (isConcluida) {
            concluido += 1; // A cor verde
          } else if (!isConcluida && isAtrasada) {
            atrasado += 1; // A cor vermelha
          } else {
            emAndamento += 1; // A cor amarela
          }
        });

        setDataGrafico([concluido, emAndamento, atrasado]);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar dados do Supabase:', error);
      }
    };

    fetchAtividades();
  }, []); // O useEffect roda uma vez quando o componente é montado

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Dados para o gráfico com base nas quantidades
  const data = {
    labels: ['Concluído', 'Em Andamento', 'Atrasado'],
    datasets: [
      {
        data: dataGrafico, // Dados calculados dinamicamente
        backgroundColor: ['#28a745', '#ffc107', '#dc3545'], // Cores verde, amarelo e vermelho
        borderColor: ['#28a745', '#ffc107', '#dc3545'],
        borderWidth: 1,
      },
    ],
  };

  // Configuração do gráfico
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
            size: 10, // Reduzindo o tamanho da fonte da legenda
            weight: 'bold', // Usando "bold", que é um valor aceito
          },
          usePointStyle: true, // Usando quadrados em vez de retângulos
        },
      },
    },
    cutout: 80, // Cortando o gráfico para diminuir o espaço preenchido
    aspectRatio: 1, // Garantindo que a altura e a largura sejam proporcionais
  };

  return (
    <div style={{ maxWidth: '200px', margin: '0 auto' }}>
      <Doughnut data={data} height={200} width={200} /> {/* Gráfico */}
    </div>
  );
};

export default Graf;
