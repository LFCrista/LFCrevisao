'use client'; // Marca o componente para ser renderizado no cliente

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // Importando o cliente Supabase

const ListRecb = () => {
  const [atividades, setAtividades] = useState<any[]>([]); // Estado para armazenar as atividades
  const [loading, setLoading] = useState(true); // Estado de carregamento

  useEffect(() => {
    // Função para buscar as 5 últimas atividades recebidas
    const fetchAtividades = async () => {
      try {
        const { data, error } = await supabase
          .from('atividades')
          .select('id, titulo, user_id, concluida, end_date, entrega_date') // Colunas necessárias
          .or('concluida.eq.true,concluida.eq.false') // Ou atividades concluídas ou atrasadas
          .order('entrega_date', { ascending: false }) // Ordenar pelas atividades mais recentes pela data de entrega
          .limit(5); // Limitando a 5 atividades

        if (error) {
          console.error('Erro ao buscar atividades:', error.message || error);
          throw new Error(error.message || 'Erro ao buscar atividades');
        }

        // Filtrando atividades para excluir as pendentes
        const atividadesFiltradas = data.filter((atividade) => {
          const currentDate = new Date(); // Data atual
          const endDate = new Date(atividade.end_date); // Data de fim da atividade
          // Só manter as atividades que são "Concluídas" ou "Atrasadas"
          return atividade.concluida || endDate < currentDate;
        });

        // Buscando o nome dos usuários designados
        const atividadesComUsuarios = await Promise.all(
          atividadesFiltradas.map(async (atividade) => {
            const { data: usuario, error: usuarioError } = await supabase
              .from('users')
              .select('name') // Buscando pelo nome do usuário
              .eq('id', atividade.user_id) // Usando o user_id para buscar o revisor
              .single();

            if (usuarioError) {
              console.error('Erro ao buscar usuário:', usuarioError.message || usuarioError);
              return { ...atividade, name_usuario: 'Desconhecido' };
            }

            return {
              ...atividade,
              name_usuario: usuario ? usuario.name : 'Desconhecido',
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
  }, []); // A query roda apenas uma vez, quando o componente for montado

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
            const currentDate = new Date(); // Data atual
            const endDate = new Date(atividade.end_date); // Data de fim da atividade
            const entregaDate = atividade.entrega_date ? new Date(atividade.entrega_date) : null; // Data de entrega, se houver
            
            // Verifica se a atividade está atrasada
            let status = '';
            if (atividade.concluida) {
              status = 'Concluído';
            } else if (endDate < currentDate) {
              // A atividade está atrasada se o end_date for passado
              status = 'Atrasado';
            }

            return (
              <tr
                key={atividade.id}
                className="hover:bg-gray-100 transition-all duration-300"
              >
                <td className="px-6 py-4">{atividade.titulo}</td>
                <td className="px-6 py-4">{atividade.name_usuario}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full ${
                      status === 'Concluído'
                        ? 'bg-green-100 text-green-800'
                        : status === 'Atrasado'
                        ? 'bg-red-100 text-red-800'
                        : ''
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {/* Exibe a data com hora no fuso horário UTC-3 e formato de 24h */}
                  {entregaDate
                    ? entregaDate.toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo', // Ajuste para o fuso horário UTC-3
                        hour12: false, // Formato de hora 24h
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
