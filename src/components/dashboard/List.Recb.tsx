'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ListRecb = () => {
  const [atividades, setAtividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const { data, error } = await supabase
          .from('atividades')
          .select('id, titulo, user_id, status, end_date, entrega_date')
          .in('status', ['Concluída', 'Atrasada', 'Em Progresso']) // ← agora inclui Em Progresso
          .order('entrega_date', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Erro ao buscar atividades:', error.message || error);
          throw new Error(error.message || 'Erro ao buscar atividades');
        }

        const atividadesComUsuarios = await Promise.all(
          data.map(async (atividade) => {
            const { data: usuario, error: usuarioError } = await supabase
              .from('users')
              .select('name')
              .eq('id', atividade.user_id)
              .single();

            return {
              ...atividade,
              name_usuario: usuario?.name || 'Desconhecido',
            };
          })
        );

        setAtividades(atividadesComUsuarios);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar atividades:', error);
        setLoading(false);
      }
    };

    fetchAtividades();
  }, []);

  if (loading) {
    return <div className="text-center py-4 text-lg font-semibold text-gray-600">Carregando...</div>;
  }

  return (
    <div className="overflow-x-auto bg-gray-50 py-6 px-4 rounded-2xl shadow-xl">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6">Últimas Atividades Recebidas</h2>
      <table className="min-w-full table-auto text-sm text-gray-600 border-separate border-spacing-0 rounded-2xl overflow-hidden">
        <thead>
          <tr className="bg-gradient-to-r from-green-600 via-green-500 to-blue-500 text-white">
            <th className="px-6 py-3 text-left font-medium">Título</th>
            <th className="px-6 py-3 text-left font-medium">Revisor</th>
            <th className="px-6 py-3 text-left font-medium">Status</th>
            <th className="px-6 py-3 text-left font-medium">Data da Entrega</th>
          </tr>
        </thead>
        <tbody>
          {atividades.map((atividade) => {
            const entregaDate = atividade.entrega_date ? new Date(atividade.entrega_date) : null;

            let statusClass = '';
            if (atividade.status === 'Concluída') {
              statusClass = 'bg-green-100 text-green-800';
            } else if (atividade.status === 'Atrasada') {
              statusClass = 'bg-red-100 text-red-800';
            } else if (atividade.status === 'Em Progresso') {
              statusClass = 'bg-blue-100 text-blue-800';
            }

            return (
              <tr key={atividade.id} className="hover:bg-gray-100 transition-all duration-300">
                <td className="px-6 py-4">{atividade.titulo}</td>
                <td className="px-6 py-4">{atividade.name_usuario}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full ${statusClass}`}>
                    {atividade.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {entregaDate
                    ? entregaDate.toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        hour12: false,
                      })
                    : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ListRecb;
