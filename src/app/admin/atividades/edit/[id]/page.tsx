'use client'; // Marca este arquivo como componente de cliente

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar'; // Importe a sidebar
import { withAuth } from '../../../../../lib/auth';

const EditarAtividade = () => {
  const router = useRouter();
  const { id } = useParams();
  const [atividade, setAtividade] = useState<any | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState(''); // Novo estado para descrição
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entregaDate, setEntregaDate] = useState('');
  const [concluida, setConcluida] = useState(false);
  const [revisor, setRevisor] = useState<any | null>(null); // Novo estado para revisor
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [arquivoUrl, setArquivoUrl] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null); // Para armazenar o novo arquivo selecionado
  const [usuarioBusca, setUsuarioBusca] = useState<string>(''); // Para armazenar o texto de busca
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<any[]>([]); // Para armazenar os usuários encontrados

  // Carregar dados da atividade
  useEffect(() => {
    const fetchAtividade = async () => {
      try {
        if (id) {
          const { data, error } = await supabase
            .from('atividades')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            setError(error.message);
          } else {
            setAtividade(data);
            setTitulo(data.titulo);
            setDescricao(data.descricao); // Carrega a descrição
            setStartDate(data.start_date);
            setEndDate(data.end_date);
            setEntregaDate(data.entrega_date);
            setConcluida(data.concluida);
            setArquivoUrl(data.arquivo_url); // Carrega o caminho do arquivo
            setRevisor(data.user_id); // Carrega o revisor (user_id)
          }
        }
      } catch (error) {
        setError('Erro ao carregar a atividade.');
      } finally {
        setLoading(false);
      }
    };

    fetchAtividade();
  }, [id]);

  // Função para buscar usuários
  const buscarUsuarios = async (name: string) => {
    if (name.trim() === '') {
      setUsuariosEncontrados([]); // Se a busca estiver vazia, limpar a lista de resultados
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name') // Pegue o ID e nome dos usuários
      .ilike('name', `%${name}%`); // Buscar por nome similar

    if (error) {
      console.error('Erro ao buscar usuários:', error.message);
    } else {
      setUsuariosEncontrados(data || []);
    }
  };

  // Função para lidar com a mudança de valor no campo de busca de revisor
  const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setUsuarioBusca(valor);
    buscarUsuarios(valor); // Buscar usuários quando o texto mudar
  };

  // Função para preencher o campo de revisor com o usuário selecionado
  const preencherCampoRevisor = (name: string, id: string) => {
    setRevisor(id);
    setUsuarioBusca(name); // Preenche o campo com o nome do revisor
    setUsuariosEncontrados([]); // Limpa os resultados da busca
  };

  // Função para lidar com a atualização dos dados
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo || !startDate || !endDate || !descricao || !revisor) {
      setError('Todos os campos obrigatórios devem ser preenchidos!');
      return;
    }

    let novoArquivoUrl = arquivoUrl;
    if (arquivo) {
      try {
        const deleteResult = await excluirArquivoAnterior();
        if (deleteResult.message) {
          setError(deleteResult.message);
          return;
        }

        const pathPrefix = arquivoUrl.split('/').slice(0, -1).join('/');
        const newFilePath = `${pathPrefix}/${arquivo.name}`;

        const { data, error } = await supabase
          .storage
          .from('atividades-enviadas')
          .upload(newFilePath, arquivo, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) {
          setError(error.message);
          return;
        }

        novoArquivoUrl = data?.path;
      } catch (error) {
        setError('Erro ao fazer o upload do novo arquivo.');
        return;
      }
    }

    // Atualizar a atividade com o novo arquivo e outros dados
    const { error } = await supabase
      .from('atividades')
      .update({
        titulo,
        descricao,
        start_date: startDate,
        end_date: endDate,
        entrega_date: entregaDate || null,
        concluida,
        user_id: revisor, // Atualiza o user_id do revisor
        arquivo_url: novoArquivoUrl,
      })
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      router.push('/admin/atividades');
    }
  };

  // Função para excluir o arquivo anterior
  const excluirArquivoAnterior = async () => {
    if (!arquivoUrl) return { message: 'Nenhum arquivo anterior para excluir.' };

    try {
      const { error } = await supabase.storage.from('atividades-enviadas')
        .remove([arquivoUrl]);

      if (error) throw error;

      return { message: '' };
    } catch (error) {
      return { message: 'Erro ao excluir o arquivo anterior.' };
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  const formatDateForInput = (date: string) => {
    return date ? new Date(date).toISOString().split('T')[0] : '';
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar Fixa */}
      <div className="fixed left-0 top-0 h-screen w-44 bg-gray-800 text-white">
        <Sidebar />
      </div>

      {/* Container Flex para Centralizar o Formulário */}
      <div className="ml-64 flex-1 p-6 overflow-y-auto">
        <form onSubmit={handleUpdate} className="w-full max-w-3xl mx-auto space-y-6 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">Editar Atividade</h2>

          {/* Outros campos do formulário */}
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
              rows={4} // Definiu uma altura maior para texto
              required
            />
          </div>

          {/* Campo de busca de revisor */}
          <div>
            <label htmlFor="revisor" className="block text-sm font-medium text-gray-700">
              Revisor
            </label>
            <input
              type="text"
              id="revisor"
              value={usuarioBusca}
              onChange={handleBuscaChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Escolha um revisor"
              required
            />
            {usuarioBusca && usuariosEncontrados.length > 0 && (
              <div className="mt-2 max-w-md">
                {usuariosEncontrados.map((usuario) => (
                  <span
                    key={usuario.id}
                    onClick={() => preencherCampoRevisor(usuario.name, usuario.id)}
                    className="block cursor-pointer p-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    {usuario.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              Data de Início
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formatDateForInput(startDate)}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
              Data de Fim
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formatDateForInput(endDate)}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="entrega_date" className="block text-sm font-medium text-gray-700">
              Data de Entrega (opcional)
            </label>
            <input
              type="date"
              id="entrega_date"
              name="entrega_date"
              value={formatDateForInput(entregaDate)}
              onChange={(e) => setEntregaDate(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Exibindo outros campos do formulário, como o arquivo, etc. */}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="concluida"
              checked={concluida}
              onChange={() => setConcluida(!concluida)}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="concluida" className="ml-2 text-sm text-gray-700">
              Concluída
            </label>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="mt-4 flex justify-between items-center">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
            >
              Atualizar Atividade
            </button>
            <Link href="/admin/atividades">
              <button type="button" className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600">
                Cancelar
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default withAuth(EditarAtividade);
