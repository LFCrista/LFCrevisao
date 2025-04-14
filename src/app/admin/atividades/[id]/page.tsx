'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import Sidebar from '../../../../components/dashboard/Sidebar';
import { withAuth } from '../../../../lib/auth';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const AtividadeDetalhes = () => {
  const { id } = useParams() as { id: string | string[] };
  const router = useRouter();
  const [atividade, setAtividade] = useState<any>(null);
  const [revisor, setRevisor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<{ days: number, hours: number, minutes: number } | null>(null);

  const atividadeId = Array.isArray(id) ? id[0] : id;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const calculateTimeRemaining = (startDate: string, endDate: string) => {
    const currentDate = new Date();
    const end = new Date(endDate);
    if (currentDate >= end) return null;

    const diff = end.getTime() - currentDate.getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));
    const hours = Math.floor((diff % (1000 * 3600 * 24)) / (1000 * 3600));
    const minutes = Math.floor((diff % (1000 * 3600)) / (1000 * 60));
    return { days, hours, minutes };
  };

  const calculateStatus = (status: string) => {
    switch (status) {
      case 'Pendente':
        return { status: 'Pendente', colorClass: 'bg-yellow-500' };
      case 'Em Progresso':
        return { status: 'Em Progresso', colorClass: 'bg-blue-500' };
      case 'Concluída':
        return { status: 'Concluída', colorClass: 'bg-green-500' };
      case 'Atrasada':
        return { status: 'Atrasada', colorClass: 'bg-red-500' };
      default:
        return { status: 'Desconhecido', colorClass: 'bg-gray-500' };
    }
  };
  

  useEffect(() => {
    const fetchAtividade = async () => {
      try {
        const { data, error } = await supabase
          .from('atividades')
          .select('*')
          .eq('id', atividadeId)
          .single();

        if (error) {
          console.error('Erro ao buscar atividade:', error);
          return;
        }

        setAtividade(data);
        const timeRemaining = calculateTimeRemaining(data.start_date, data.end_date);
        setTimeRemaining(timeRemaining);

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('id', data.user_id)
          .single();

        if (userError) {
          console.error('Erro ao buscar revisor:', userError);
          setRevisor('Desconhecido');
          return;
        }

        setRevisor(userData ? userData.name : 'Desconhecido');
        setLoading(false);
      } catch (err) {
        console.error('Erro geral:', err);
      }
    };

    fetchAtividade();
  }, [atividadeId]);

  const handleDownloadFolder = async (bucket: string, fullPath: string, zipFileName: string) => {
    try {
      if (!fullPath) return;

      const pathParts = fullPath.split('/').filter(Boolean);
      const lastFolder = pathParts[pathParts.length - 1];
      const folderPath = fullPath.endsWith('/') ? fullPath.slice(0, -1) : fullPath;

      const { data: listData, error: listError } = await supabase.storage
        .from(bucket)
        .list(folderPath);

      if (listError) throw listError;

      if (!listData || listData.length === 0) {
        alert('Nenhum arquivo encontrado para baixar.');
        return;
      }

      const zip = new JSZip();

      for (const file of listData) {
        const filePath = `${folderPath}/${file.name}`;
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(filePath);

        if (downloadError) {
          console.error(`Erro ao baixar ${file.name}:`, downloadError.message);
          continue;
        }

        zip.file(file.name, fileData);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${lastFolder || zipFileName}.zip`);
    } catch (err: any) {
      console.error('Erro ao baixar arquivos da pasta:', err.message || err);
      alert('Erro ao baixar arquivos. Tente novamente.');
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!atividade) return <div>Atividade não encontrada.</div>;

  const { status, colorClass } = calculateStatus(atividade.status);

  return (
    <div className="flex min-h-screen">
      <div className="fixed">
        <Sidebar />
      </div>

      <div className="flex-1 ml-64 overflow-y-auto p-8 bg-gray-100">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-4 text-center">{atividade.titulo}</h1>
          <h2 className="text-xl font-semibold mb-6 text-gray-700 whitespace-pre-wrap">{atividade.descricao}</h2>

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

            {atividade.obs_envio && (
  <p className="mt-4 whitespace-pre-wrap">
    <strong>Observação do Envio:</strong><br />
    {atividade.obs_envio}
  </p>
)}

{status !== 'Concluída' && status !== 'Atrasada' && timeRemaining && (
  <p><strong>Tempo Restante:</strong> {`${timeRemaining.days} dias, ${timeRemaining.hours} horas, ${timeRemaining.minutes} minutos`}</p>
)}

          </div>

          {atividade.arquivo_url && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => handleDownloadFolder('atividades-enviadas', atividade.arquivo_url, 'arquivos-enviados')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                📁 Baixar Arquivos Enviados (.zip)
              </button>
            </div>
          )}

          {atividade.feito_url && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => handleDownloadFolder('atividades-recebidas', atividade.feito_url, 'atividade-feita')}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                📁 Baixar Atividade Feita (.zip)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(AtividadeDetalhes);
