import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Importando o useRouter correto para o app directory

interface AtividadesListProps {
  atividades: any[]; // Tipando as atividades que são passadas como uma lista
  userId: string;
}

const AtividadesList: React.FC<AtividadesListProps> = ({ atividades, userId }) => {
  const [searchQuery, setSearchQuery] = useState<string>(''); // Estado para armazenar a pesquisa
  const router = useRouter(); // Hook para navegação no Next.js

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Função para definir o status de cada atividade
  const getStatusClass = (atividade: any) => {
    const currentDate = new Date();
    const endDate = new Date(atividade.end_date);
    if (atividade.concluida) {
      return 'bg-green-500 text-white'; // Concluído - Verde
    } else if (endDate < currentDate) {
      return 'bg-red-500 text-white'; // Atrasado - Vermelho
    } else {
      return 'bg-yellow-500 text-white'; // Pendente - Amarelo
    }
  };

  // Função para lidar com a pesquisa
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Filtrar atividades com base na busca
  const filteredAtividades = atividades.filter((atividade) =>
    atividade.titulo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Função para redirecionar para a página da atividade específica
  const handleRowClick = (id: string) => {
    router.push(`/admin/atividades/${id}`); // Redireciona para a página com o ID da atividade
  };

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold text-gray-700">Lista de Atividades</h3>

      {/* Campo de busca */}
      <div className="my-4">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={searchQuery}
          onChange={handleSearch}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <table className="min-w-full table-auto text-sm text-gray-600 border-separate border-spacing-0 rounded-2xl overflow-hidden">
        <thead>
          <tr className="bg-gradient-to-r from-green-600 via-green-500 to-blue-500 text-white">
            <th className="px-6 py-3 text-left font-medium">Título</th>
            <th className="px-6 py-3 text-left font-medium">Status</th>
            <th className="px-6 py-3 text-left font-medium">Data de Início</th>
            <th className="px-6 py-3 text-left font-medium">Data de Fim</th>
          </tr>
        </thead>
        <tbody>
          {filteredAtividades.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-gray-600 py-4">Nenhuma atividade encontrada.</td>
            </tr>
          ) : (
            filteredAtividades.map((atividade) => {
              const statusClass = getStatusClass(atividade);
              return (
                <tr
                  key={atividade.id}
                  className="border-b cursor-pointer"
                  onClick={() => handleRowClick(atividade.id)} // Clique na linha redireciona para a página da atividade
                >
                  <td className="px-6 py-3">{atividade.titulo}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full ${statusClass}`}>
                      {atividade.concluida
                        ? 'Concluído'
                        : new Date(atividade.end_date) < new Date()
                        ? 'Atrasado'
                        : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-3">{formatDate(atividade.start_date)}</td>
                  <td className="px-6 py-3">{formatDate(atividade.end_date)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AtividadesList;
