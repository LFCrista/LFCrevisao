// components/dashboard/List.env.tsx

'use client'; // Adiciona esta linha no topo do seu arquivo

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // Certifique-se de que o caminho de importação está correto

const ListEnv = () => {
  const [atividades, setAtividades] = useState<any[]>([]); // Estado para armazenar as atividades
  const [loading, setLoading] = useState(true); // Estado de carregamento

  useEffect(() => {
    // Função para buscar as 5 últimas atividades criadas
    const fetchAtividades = async () => {
      try {
        const { data, error } = await supabase
          .from('atividades')
          .select('id, titulo, start_date, user_id, created_at') // Incluindo a coluna created_at
          .order('created_at', { ascending: false }) // Ordenando pelas últimas atividades criadas
          .limit(5); // Limitando a 5 atividades

        if (error) {
          console.error('Erro ao buscar atividades:', error.message || error);
          throw new Error(error.message || 'Erro ao buscar atividades');
        }

        // Buscando o nome dos usuários designados
        const atividadesComUsuarios = await Promise.all(
          data.map(async (atividade) => {
            const { data: usuario, error: usuarioError } = await supabase
              .from('users')
              .select('name') // Alterado de "name" para "nome"
              .eq('id', atividade.user_id) // Buscando pelo ID do usuário designado
              .single(); // Esperando um único usuário

            if (usuarioError) {
              console.error('Erro ao buscar usuário:', usuarioError.message || usuarioError);
              return { ...atividade, name_usuario: 'Desconhecido' };
            }

            return {
              ...atividade,
              name_usuario: usuario ? usuario.name : 'Desconhecido', // Usando "nome" em vez de "name"
            };
          })
        );

        setAtividades(atividadesComUsuarios);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar atividades:', error); // Logando o erro completo
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
      <h2 className="text-3xl font-semibold text-gray-700 mb-6">Últimas Atividades Criadas</h2>
      <table className="min-w-full table-auto text-sm text-gray-600 border-separate border-spacing-0 rounded-2xl overflow-hidden">
        <thead>
          <tr className="bg-gradient-to-r from-blue-500 to-teal-400 text-white">
            <th className="px-6 py-3 text-left font-medium">Título</th>
            <th className="px-6 py-3 text-left font-medium">Data de Início</th>
            <th className="px-6 py-3 text-left font-medium">Revisor</th>
          </tr>
        </thead>
        <tbody>
          {atividades.map((atividade) => (
            <tr
              key={atividade.id}
              className="hover:bg-gray-100 transition-all duration-300"
            >
              <td className="px-6 py-4">{atividade.titulo}</td>
              <td className="px-6 py-4">{new Date(atividade.start_date).toLocaleString()}</td>
              <td className="px-6 py-4">{atividade.name_usuario}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListEnv;
