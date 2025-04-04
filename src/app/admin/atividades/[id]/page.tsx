'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Usando o hook useParams e useRouter
import { supabase } from '../../../../lib/supabase';
import Sidebar from '../../../../components/dashboard/Sidebar'; // Importando a sidebar
import { withAuth } from '../../../../lib/auth'

const AtividadeDetalhes = () => {
  const { id } = useParams(); // Obtendo o ID diretamente da URL
  const router = useRouter(); // Hook para navegar
  const [atividade, setAtividade] = useState<any>(null);
  const [revisor, setRevisor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<{ days: number, hours: number, minutes: number } | null>(null);

  // Garantir que o id seja uma string
  const atividadeId = Array.isArray(id) ? id[0] : id;

  // Função para formatar a data manualmente
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Função para calcular o tempo restante
  const calculateTimeRemaining = (startDate: string, endDate: string) => {
    const currentDate = new Date();
    const end = new Date(endDate);

    // Verifique se a data de fim já passou
    if (currentDate >= end) {
      return null; // Caso a atividade já tenha passado o prazo
    }

    // Calculando a diferença em milissegundos
    const diff = end.getTime() - currentDate.getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));
    const hours = Math.floor((diff % (1000 * 3600 * 24)) / (1000 * 3600));
    const minutes = Math.floor((diff % (1000 * 3600)) / (1000 * 60));

    return { days, hours, minutes };
  };

  // Calculando o status da atividade com cores para os fundos
  const calculateStatus = (concluida: boolean, endDate: string) => {
    const currentDate = new Date();
    const end = new Date(endDate);

    if (concluida) {
      return { status: 'Concluída', colorClass: 'bg-green-500' }; // Verde
    } else if (currentDate > end) {
      return { status: 'Atrasada', colorClass: 'bg-red-500' }; // Vermelho
    } else {
      return { status: 'Pendente', colorClass: 'bg-yellow-500' }; // Amarelo
    }
  };

  useEffect(() => {
    const fetchAtividade = async () => {
      try {
        const { data, error } = await supabase
          .from('atividades')
          .select('*')
          .eq('id', atividadeId)
          .single(); // Usando .single() para pegar apenas um resultado

        if (error) {
          console.error('Erro ao buscar atividade:', error);
          return;
        }

        setAtividade(data); // Definindo a atividade no estado

        // Calculando o tempo restante
        const timeRemaining = calculateTimeRemaining(data.start_date, data.end_date);
        setTimeRemaining(timeRemaining); // Armazenando o tempo restante

        // Agora, vamos buscar o usuário que é o revisor
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('id', data.user_id)
          .single(); // Usando .single() para pegar apenas um resultado

        if (userError) {
          console.error('Erro ao buscar revisor:', userError);
          setRevisor('Desconhecido');
          return;
        }

        setRevisor(userData ? userData.name : 'Desconhecido');
        setLoading(false); // Alterando o estado de loading
      } catch (err) {
        console.error('Erro geral:', err);
      }
    };

    fetchAtividade();
  }, [atividadeId]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!atividade) {
    return <div>Atividade não encontrada.</div>;
  }

  // Calculando o status da atividade
  const { status, colorClass } = calculateStatus(atividade.concluida, atividade.end_date);

  const handleDownload = async (url: string | null, bucket: string) => {
    if (!url || !bucket) return;

    try {
      const { data: fileData, error } = await supabase.storage
        .from(bucket)
        .download(url);

      if (error) throw error;

      const fileBlob = new Blob([fileData], { type: 'application/octet-stream' });
      const fileUrl = URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = fileUrl;
      const fileName = url.split('/').pop() || 'arquivo_desconhecido';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Erro ao fazer o download:', error.message || error);
      alert('Erro inesperado ao fazer o download. Tente novamente.');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8 bg-gray-100 min-h-screen">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-4 text-center">{atividade.titulo}</h1>
          <h2 className="text-xl font-semibold mb-6 text-center text-gray-700">{atividade.descricao}</h2>

          <div className="space-y-4">
            {revisor && (
              <span
                className="inline-block px-6 py-2 text-white rounded-2xl bg-[#6734eb] text-lg font-bold cursor-pointer"
                onClick={() => router.push(`/admin/revisores/${atividade.user_id}`)}
              >
                {revisor}
              </span>
            )}

            <p><strong>Data de Início:</strong> {formatDate(atividade.start_date)}</p>
            <p><strong>Data de Fim:</strong> {formatDate(atividade.end_date)}</p>
            {atividade.data_entrega && <p><strong>Data de Entrega:</strong> {formatDate(atividade.data_entrega)}</p>}

            <p>
              <strong>Status:</strong>
              <span className={`inline-block ml-2 px-3 py-1 text-white rounded-full ${colorClass}`}>
                {status}
              </span>
            </p>

            {status !== 'Concluída' && status !== 'Atrasada' && timeRemaining && (
              <p><strong>Tempo Restante:</strong> {` ${timeRemaining.days} dias, ${timeRemaining.hours} horas, ${timeRemaining.minutes} minutos`}</p>
            )}
          </div>

          {atividade.arquivo_url && (
  <div
    className="mt-6 flex items-center justify-center flex-col cursor-pointer inline-flex bg-[#c7c7c7] shadow-inner rounded-lg p-4 transition-all hover:bg-gray-400"
    onClick={() => handleDownload(atividade.arquivo_url, 'atividades-enviadas')}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="w-15 h-15"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
    <span className="mt-2">{atividade.arquivo_url.split('/').pop()}</span> {/* Exibe o nome do arquivo */}
  </div>
)}


          {atividade.feito_url && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => handleDownload(atividade.feito_url, 'atividades-recebidas')}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                  <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                </svg>
                Baixar Atividade Feita
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(AtividadeDetalhes);
