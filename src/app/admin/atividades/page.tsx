'use client'; // Marca este arquivo como componente de cliente

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase'; // Importando o cliente Supabase
import Sidebar from '@/components/dashboard/Sidebar'; // Importando a Sidebar
import Link from 'next/link'; // Importando o Link do Next.js para navegação
import { useRouter } from 'next/navigation'; // Importando o useRouter correto para o app directory
import { withAuth } from '../../../lib/auth'

const AtividadesAdmin = () => {
  const [atividades, setAtividades] = useState<any[]>([]); // Estado para armazenar as atividades
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const [search, setSearch] = useState(''); // Estado para armazenar o valor da pesquisa
  const [startDateFilter, setStartDateFilter] = useState<string>(''); // Filtro para start_date
  const [endDateFilter, setEndDateFilter] = useState<string>(''); // Filtro para end_date
  const [statusFilter, setStatusFilter] = useState<string>(''); // Filtro para status de conclusão
  const [entregaDateFilter, setEntregaDateFilter] = useState<string>(''); // Filtro para entrega_date
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false); // Estado para controle do modal de filtro
  const router = useRouter(); // Hook para navegação

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
  
  const calculateStatus = (concluida: boolean, endDate: string) => {
    const currentDate = new Date();
    const endDateObj = new Date(endDate);

    if (concluida) {
      return 'Concluído';
    } else if (endDateObj < currentDate) {
      return 'Atrasado';
    } else {
      return 'Pendente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-100 text-green-800';
      case 'Atrasado':
        return 'bg-red-100 text-red-800';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return '';
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStartDateFilter('');
    setEndDateFilter('');
    setStatusFilter('');
    setEntregaDateFilter('');
  };

  

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        let query = supabase.from('atividades').select(
          'id, titulo, concluida, start_date, end_date, entrega_date, user_id, feito_url'
        );

        if (search) {
          query = query.ilike('titulo', `%${search}%`);
        }

        if (startDateFilter) {
          query = query.gte('start_date', `${startDateFilter}T00:00:00Z`);
        }

        if (endDateFilter) {
          query = query.gte('end_date', `${endDateFilter}T00:00:00Z`);
        }

        if (entregaDateFilter) {
          query = query.gte('entrega_date', `${entregaDateFilter}T00:00:00Z`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Erro ao buscar atividades:', error.message || error);
          throw new Error(error.message || 'Erro ao buscar atividades');
        }

        let atividadesComUsuarios = await Promise.all(
          data.map(async (atividade) => {
            const { data: usuario, error: usuarioError } = await supabase
              .from('users')
              .select('name')
              .eq('id', atividade.user_id)
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

        if (statusFilter) {
          atividadesComUsuarios = atividadesComUsuarios.filter((atividade) => {
            const status = calculateStatus(atividade.concluida, atividade.end_date);
            return status === statusFilter;
          });
        }

        setAtividades(atividadesComUsuarios);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar atividades:', error);
        setLoading(false);
      }
    };

    fetchAtividades();
  }, [search, startDateFilter, endDateFilter, statusFilter, entregaDateFilter]);

  if (loading) {
    return <div className="text-center py-4 text-lg font-semibold text-gray-600">Carregando...</div>;
  }

  const countAppliedFilters = () => {
    let appliedFilters = 0;
    if (startDateFilter) appliedFilters++;
    if (endDateFilter) appliedFilters++;
    if (statusFilter) appliedFilters++;
    if (entregaDateFilter) appliedFilters++;
    return appliedFilters;
  };

  

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

  const handleDelete = async (id: number) => {
    const confirmation = confirm('Tem certeza que deseja excluir esta atividade?');
    if (confirmation) {
      try {
        const { error } = await supabase
          .from('atividades')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Erro ao excluir atividade:', error.message);
          alert('Erro ao excluir atividade.');
        } else {
          setAtividades(atividades.filter((atividade) => atividade.id !== id));
          alert('Atividade excluída com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao excluir atividade:', error);
        alert('Erro ao excluir atividade.');
      }
    }
  };

  // Função para redirecionar para a página da atividade específica
  const handleRowClick = (id: string) => {
    router.push(`/admin/atividades/${id}`); // Redireciona para a página com o ID da atividade
  };


  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-50 overflow-x-auto">
        <h2 className="text-3xl font-semibold text-gray-700 mb-6">Revisões</h2>

        <div className="mb-4 flex justify-between">
          <Link href="/admin/atividades/criar">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all">
              Nova Revisão
            </button>
          </Link>

          
        </div>

        {/* Modal de Filtros */}
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-xl font-semibold mb-4">Filtros</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Data de Início</label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Data de Término</label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Data de Entrega</label>
                <input
                  type="date"
                  value={entregaDateFilter}
                  onChange={(e) => setEntregaDateFilter(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Selecione...</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    clearFilters();
                    setIsFilterModalOpen(false);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-start space-x-2">
          <input
            type="text"
            placeholder="Pesquisar atividade"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded-md w-96"
          />

          {/* botão filtro */}
          <button className="text-gray-500 p-3 rounded-md hover:text-gray-700 transition-all flex items-center relative"
                  onClick={() => setIsFilterModalOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path fillRule="evenodd" d="M3.792 2.938A49.069 49.069 0 0 1 12 2.25c2.797 0 5.54.236 8.209.688a1.857 1.857 0 0 1 1.541 1.836v1.044a3 3 0 0 1-.879 2.121l-6.182 6.182a1.5 1.5 0 0 0-.439 1.061v2.927a3 3 0 0 1-1.658 2.684l-1.757.878A.75.75 0 0 1 9.75 21v-5.818a1.5 1.5 0 0 0-.44-1.06L3.13 7.938a3 3 0 0 1-.879-2.121V4.774c0-.897.64-1.683 1.542-1.836Z" clipRule="evenodd" />
            </svg>

            {/* Bolinha verde com o número de filtros aplicados */}
            {countAppliedFilters() > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-green-500 text-white rounded-full text-xs flex items-center justify-center">
                {countAppliedFilters()}
              </span>
            )}
          </button>
        </div>

        <table className="min-w-full table-auto text-sm text-gray-600 border-separate border-spacing-0 rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-green-600 via-green-500 to-blue-500 text-white" >
              <th className="px-6 py-3 text-left font-medium">Título</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
              <th className="px-6 py-3 text-left font-medium">Revisor</th>
              <th className="px-6 py-3 text-left font-medium">Data de Início</th>
              <th className="px-6 py-3 text-left font-medium">Data de Fim</th>
              <th className="px-6 py-3 text-left font-medium">Data de Entrega</th>
              <th className="px-6 py-3 text-left font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {atividades.map((atividade) => {
              const status = calculateStatus(atividade.concluida, atividade.end_date);
              const statusColor = getStatusColor(status);
              return (
                <tr key={atividade.id} className="border-b" >
                  <td className="px-6 py-3 cursor-pointer" onClick={() => handleRowClick(atividade.id)}>{atividade.titulo}</td>
                  <td className="px-6 py-4 cursor-pointer" onClick={() => handleRowClick(atividade.id)}>
                    <span className={`px-3 py-1 rounded-full ${statusColor}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-3 cursor-pointer"  onClick={() => handleRowClick(atividade.id)} >{atividade.name_usuario}</td>
                  <td className="px-6 py-3 cursor-pointer"  onClick={() => handleRowClick(atividade.id)} >{formatDate(atividade.start_date)}</td>
                  <td className="px-6 py-3 cursor-pointer"  onClick={() => handleRowClick(atividade.id)} >{formatDate(atividade.end_date)}</td>
                  <td className="px-6 py-3 cursor-pointer"  onClick={() => handleRowClick(atividade.id)} >{atividade.entrega_date ? formatDate(atividade.entrega_date) : 'N/A'}</td>
                  <td className="px-6 py-4 flex justify-start space-x-2" >
                    {atividade.feito_url && (
                      <button
                        onClick={() => handleDownload(atividade.feito_url, 'atividades-recebidas')}
                        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                    <button
  onClick={() => handleDelete(atividade.id)}
  className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 cursor-pointer"
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
  </svg>
</button>

<button
    onClick={() => {}}
    className="bg-yellow-400 text-white p-2 rounded-md hover:bg-yellow-500 cursor-pointer"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
      <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
    </svg>
  </button>

                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default withAuth(AtividadesAdmin);
