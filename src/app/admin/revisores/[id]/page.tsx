'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useParams } from 'next/navigation';
import { withAuth } from '../../../../lib/auth';
import AtividadesChart from '../../../../components/revisor/AtividadesGraf';  // Componente gráfico de atividades
import AtividadesList from '../../../../components/revisor/AtividadesList'; // Componente lista de atividades
import Quant from '../../../../components/revisor/AtividadesQuant'; // Componente de quantidade de atividades
import Sidebar from '../../../../components/dashboard/Sidebar'; // Importe a Sidebar

const RevisorPage = () => {
  const [atividades, setAtividades] = useState<any[]>([]); // Estado para armazenar atividades
  const [revisor, setRevisor] = useState<any>(null); // Estado para armazenar o revisor
  const [error, setError] = useState<string | null>(null); // Estado para armazenar erros

  const params = useParams();
  const id = params.id; // Acessando o parâmetro 'id'

  useEffect(() => {
    const fetchRevisorAndAtividades = async () => {
      if (!id) return; // Verifica se o 'id' está disponível

      // Buscar informações do revisor
      const { data: revisorData, error: revisorError } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', id) // Verificando se o id corresponde
        .single();

      if (revisorError) {
        console.error('Erro ao buscar revisor:', revisorError.message);
        setError('Erro ao buscar revisor.');
        return;
      }

      if (!revisorData) {
        setError('Revisor não encontrado.');
        return;
      }

      setRevisor(revisorData);

      // Buscar atividades associadas a este revisor (baseado no id do revisor)
      const { data: atividadesData, error: atividadesError } = await supabase
        .from('atividades')
        .select('id, titulo, descricao, start_date, end_date, concluida')
        .eq('user_id', id); // Filtro baseado no user_id do revisor

      if (atividadesError) {
        console.error('Erro ao buscar atividades:', atividadesError.message);
        setError('Erro ao buscar atividades.');
        return;
      }

      setAtividades(atividadesData || []);
    };

    fetchRevisorAndAtividades();
  }, [id]);

  // Garantir que o id seja uma string antes de passar para Quant
  const userId = typeof id === 'string' ? id : '';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Fixa */}
      <div className="w-64 fixed top-0 left-0 h-full bg-white shadow-md">
        <Sidebar />
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 ml-64 p-6">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
          Atividades do Revisor: {revisor?.name}
        </h2>

        {error && (
          <p className="text-red-600 text-center">{error}</p>
        )}

        {atividades.length === 0 ? (
          <p className="text-gray-600 text-center">Este revisor não possui atividades atribuídas.</p>
        ) : (
          <>
            {/* Contêiner flex para alinhar Quant e AtividadesChart */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              {/* Passando o id como userId para o componente Quant */}
              {userId && <Quant userId={userId} />}

              {/* Gráfico de Rosquinha */}
              <AtividadesChart atividades={atividades} />
            </div>

            {/* Lista de atividades */}
            <div className="mb-8">
              {/* Atualização do componente AtividadesList */}
              <AtividadesList atividades={atividades} userId={userId} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default withAuth(RevisorPage);
