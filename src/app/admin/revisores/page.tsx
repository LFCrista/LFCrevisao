'use client'; // Marca este arquivo como componente de cliente

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import Sidebar from '@/components/dashboard/Sidebar'; // Importando a Sidebar
import { useRouter } from 'next/navigation'; // Importando o useRouter correto para o app directory

// Definindo o tipo User
interface User {
  id: string; // Usando 'id' da tabela 'users'
  email: string;
  name: string;
}

function Users() {
  const [users, setUsers] = useState<User[]>([]); // Estado para armazenar os usuários
  const [search, setSearch] = useState<string>(''); // Estado para armazenar o valor da busca
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]); // Estado para armazenar os usuários filtrados
  const [error, setError] = useState<string | null>(null); // Estado para armazenar erros
  const router = useRouter(); // Hook para navegação

  // Função para buscar os usuários
  const fetchUsers = async () => {
    const { data: publicUsers, error: publicUsersError } = await supabase
      .from('users')
      .select('*')
      .limit(10);

    if (publicUsersError) {
      console.error('Erro ao buscar usuários na tabela "users":', publicUsersError);
      setError(`Erro ao buscar usuários na tabela "users": ${publicUsersError.message}`);
      return;
    }

    setUsers(publicUsers || []);
    setFilteredUsers(publicUsers || []);
  };

  // Função para filtrar os usuários pelo nome
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearch(query);

    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  // Função para deletar usuário
  const handleDelete = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Erro ao excluir o usuário:', error);
        setError('Erro ao excluir o usuário');
      } else {
        setUsers(users.filter((user) => user.id !== userId));
        setFilteredUsers(filteredUsers.filter((user) => user.id !== userId));
        alert('Usuário excluído com sucesso!');
      }
    }
  };

  // Função para redirecionar para a página de revisores com o id do usuário
  const handleRedirectToRevisor = (userId: string) => {
    router.push(`/admin/revisores/${userId}`);
  };

  // Função para redirecionar para a página de criação de revisores
  const handleCreateRevisor = () => {
    router.push('/admin/revisores/criar');
  };

  useEffect(() => {
    fetchUsers(); // Chama a função quando a página é carregada
  }, []);  // Certifique-se de que a consulta é feita apenas uma vez

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 p-6 bg-gray-50 overflow-x-auto">
        <h2 className="text-3xl font-semibold text-gray-700 mb-6">Lista de Usuários</h2>

        {/* Container flex para o botão e a barra de pesquisa */}
        <div className="flex flex-col mb-4 space-y-4">
          {/* Botão Novo Revisor */}
          <div className="flex justify-start">
            <button
              onClick={handleCreateRevisor}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Novo Revisor
            </button>
          </div>

          {/* Barra de pesquisa */}
          <div className="flex justify-start">
            <input
              type="text"
              placeholder="Buscar por nome"
              className="px-4 py-2 border border-gray-300 rounded-lg w-1/3"
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Exibir mensagem de erro, se houver */}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        {/* Tabela de usuários */}
        {filteredUsers.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum usuário encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-gradient-to-r from-green-600 via-green-500 to-blue-500 text-white">
                  <th className="px-6 py-3 text-left text-sm font-semibold rounded-tl-lg">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">E-mail</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold rounded-tr-lg">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800 rounded-l-lg">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 flex space-x-2 rounded-r-lg">
                      {/* Editar */}
                      <button
                        className="bg-yellow-500 text-white p-2 rounded-md hover:bg-yellow-600"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                          <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                        </svg>
                      </button>

                      {/* Excluir */}
                      <button
                        className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
                        onClick={() => handleDelete(user.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Botão verde com novo ícone */}
                      <button
                        className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
                        onClick={() => handleRedirectToRevisor(user.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;
