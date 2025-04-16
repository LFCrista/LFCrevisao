'use client'; // Marca o componente para ser renderizado no cliente

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react'; // Importando useState, useRef e useEffect
import { createPortal } from 'react-dom'; // Importando createPortal para renderizar o modal
import { supabase } from '@/lib/supabase'; // Certifique-se de importar o Supabase

// Definição do tipo para as notificações
interface Notification {
  id: string;
  texto: string;
  link: string;
  visto?: boolean; // Adicionando a propriedade 'visto' para indicar se a notificação foi vista
}

const Sidebar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar o modal
  const [liDimensions, setLiDimensions] = useState({ top: 0, height: 0 }); // Estado para armazenar as dimensões do li
  const [notifications, setNotifications] = useState<Notification[]>([]); // Estado para armazenar as notificações do usuário
  const notificationRef = useRef<HTMLLIElement>(null); // Referência para o elemento de notificações

  // Função para abrir o modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Atualiza as dimensões do li quando o modal é aberto
  useEffect(() => {
    if (isModalOpen && notificationRef.current) {
      const rect = notificationRef.current.getBoundingClientRect();
      setLiDimensions({ top: rect.top, height: rect.height });
    }
  }, [isModalOpen]);

  // Busca as notificações do usuário logado
  useEffect(() => {
    const fetchNotifications = async () => {
      const userId = localStorage.getItem('user_id'); // Obtém o user_id do localStorage
      if (!userId) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('id, texto, link, visto')
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao buscar notificações:', error.message);
      } else {
        setNotifications(data as Notification[]); // Atualiza o estado com as notificações
      }
    };

    fetchNotifications();
  }, []);

  // Listener para novas notificações em tempo real
  useEffect(() => {
    const userId = localStorage.getItem('user_id'); // Obtém o user_id do localStorage
    if (!userId) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotification = payload.new as Notification;

          // Atualiza o estado local com a nova notificação
          setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);

          // Exibe uma notificação no navegador
          if (Notification.permission === 'granted') {
            const notification = new Notification('Nova Notificação', {
              body: newNotification.texto,
              icon: '/path/to/icon.png', // Substitua pelo caminho do ícone da sua aplicação
            });

            // Redireciona para o link ao clicar na notificação
            notification.onclick = async () => {
              if (newNotification.link) {
                // Obtém o user_id do localStorage
                const userId = localStorage.getItem('user_id');
                if (!userId) {
                  console.error('Usuário não autenticado.');
                  return;
                }
            
                // Atualiza o campo 'visto' na tabela 'notification_users'
                const { error } = await supabase
                  .from('notifications')
                  .update({ visto: true }) // Define 'visto' como true
                  .eq('id', newNotification.id) // Filtra pela notificação
                  .eq('user_id', userId); // Filtra pelo usuário atual
            
                if (error) {
                  console.error('Erro ao atualizar o campo "visto":', error.message);
                } else {
                  console.log('Notificação marcada como lida.');
                }
            
                // Abre o link em uma nova aba
                window.open(newNotification.link, '_blank');
              } else {
                console.error('Link não encontrado na notificação.');
              }
            };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription); // Remove o listener ao desmontar o componente
    };
  }, []);

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Função para realizar o logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = '/login';
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao realizar logout:', error.message);
      } else {
        console.error('Erro ao realizar logout:', error);
      }
    }
  };

  // Função para excluir uma notificação
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao excluir notificação:', error.message);
      } else {
        setNotifications((prevNotifications) =>
          prevNotifications.filter((notification) => notification.id !== notificationId)
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao excluir notificação:', error.message);
      } else {
        console.error('Erro ao excluir notificação:', error);
      }
    }
  };

  // Função para excluir todas as notificações
  const handleClearNotifications = async () => {
    try {
      const userId = localStorage.getItem('user_id'); // Obtém o user_id do localStorage
      if (!userId) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao excluir todas as notificações:', error.message);
      } else {
        setNotifications([]); // Limpa todas as notificações do estado
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao excluir todas as notificações:', error.message);
      } else {
        console.error('Erro ao excluir todas as notificações:', error);
      }
    }
  };

  // Função para marcar uma notificação como lida
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ visto: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error.message);
      } else {
        // Atualiza o estado local para refletir a mudança
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, visto: true }
              : notification
          )
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao marcar notificação como lida:', error.message);
      } else {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    }
  };

  // Função para marcar todas as notificações como lidas
  const handleMarkAllAsRead = async () => {
    try {
      const userId = localStorage.getItem('user_id'); // Obtém o user_id do localStorage
      if (!userId) return;

      const { error } = await supabase
        .from('notifications')
        .update({ visto: true }) // Define 'visto' como true
        .eq('user_id', userId); // Filtra pelo usuário atual

      if (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error.message);
      } else {
        // Atualiza o estado local para refletir a mudança
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({
            ...notification,
            visto: true,
          }))
        );
        console.log('Todas as notificações foram marcadas como lidas.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error.message);
      } else {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
      }
    }
  };

  return (
    <div className="w-48 bg-gray-800 text-white p-6 h-screen relative">
      {/* Título da Sidebar */}
      <div className="flex items-center text-xl font-bold mb-8">
        <span>Revise.Me</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="ml-4 w-6 h-6 text-white"
        >
          <path
            fillRule="evenodd"
            d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Links da Sidebar */}
      <ul>
        {/* Dashboard */}
        <li className="ml-[-20px]">
          <Link
            href="/admin"
            className="flex items-center hover:bg-green-500 hover:text-white py-2 px-4 rounded w-full transition duration-300"
          >
            {/* Ícone de Dashboard */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                fillRule="evenodd"
                d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z"
                clipRule="evenodd"
              />
            </svg>
            Dashboard
          </Link>
        </li>

        {/* Atividades */}
        <li className="ml-[-20px]">
          <Link
            href="/admin/atividades"
            className="flex items-center hover:bg-green-500 hover:text-white py-2 px-4 rounded w-full transition duration-300"
          >
            {/* Ícone de Atividades */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                fillRule="evenodd"
                d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                clipRule="evenodd"
              />
              <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
            </svg>
            Atividades
          </Link>
        </li>

        {/* Revisores */}
        <li className="ml-[-20px]">
          <Link
            href="/admin/revisores"
            className="flex items-center hover:bg-green-500 hover:text-white py-2 px-4 rounded w-full transition duration-300"
          >
            {/* Ícone de Revisores */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 mr-2"
            >
              <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
            </svg>
            Revisores
          </Link>
        </li>

        {/* Notificações */}
        <li
  className={`ml-[-20px] relative ${isModalOpen ? 'z-[10001]' : ''}`}
  ref={notificationRef}
>
  <button
    onClick={openModal}
    className="flex items-center hover:bg-green-500 hover:text-white py-2 px-4 rounded w-full transition duration-300"
    style={{
      backgroundColor: isModalOpen ? 'rgb(31, 41, 55)' : '',
      zIndex: isModalOpen ? 10001 : 'auto',
      position: isModalOpen ? 'relative' : 'static',
    }}
  >
    {/* Wrapper relativo pro ícone e bolinha */}
    <div className="relative mr-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path
          fillRule="evenodd"
          d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z"
          clipRule="evenodd"
        />
      </svg>

      {/* Bolinha vermelha */}
      {notifications.filter((n) => !n.visto).length > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full z-10">
          {notifications.filter((n) => !n.visto).length}
        </div>
      )}
    </div>
    Notificações
  </button>


          {/* Modal de Notificações */}
          {isModalOpen &&
            createPortal(
              <div className="fixed inset-0 z-[9999]">
                {/* Fundo escuro transparente com exclusão da faixa horizontal dentro da sidebar */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo preto com 50% de opacidade
                    clipPath: `polygon(
                      0 0, 
                      100% 0, 
                      100% 100%, 
                      0 100%, 
                      0 ${liDimensions.top}px, 
                      48px ${liDimensions.top}px, 
                      48px ${liDimensions.top + liDimensions.height}px, 
                      0 ${liDimensions.top + liDimensions.height}px
                    )`, // Exclui a faixa horizontal na altura do li de notificações dentro da sidebar
                  }}
                  onClick={closeModal} // Fecha o modal ao clicar no fundo
                ></div>

                {/* Modal estilo balão de fala */}
                <div
                  className="absolute z-[9999]"
                  style={{
                    top: `${liDimensions.top + liDimensions.height / 2 - 175}px`, // Centraliza o modal verticalmente com o li
                    left: '12rem', // Gruda o modal ao lado direito da sidebar
                  }}
                >
                  {/* Seta conectando o botão ao modal */}
                  <div className="absolute top-[50%] -left-2 transform -translate-y-1/2 w-4 h-4 bg-white rotate-45"></div>

                  <div className="bg-white w-[500px] h-[350px] rounded-lg shadow-lg relative flex flex-col">
                    {/* Header fixo do modal */}
                    <div className="bg-blue-900 text-white px-4 py-3 rounded-t-lg flex justify-between items-center sticky top-0 z-[10000]">
                      <h2 className="text-lg font-bold">Notificações</h2>
                      <button
                        onClick={closeModal}
                        className="text-white hover:text-gray-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Corpo do modal com scroll */}
                    <div className="p-6 overflow-y-auto flex-1 text-black">
                      <ul>
                        {notifications.map((notification) => (
                          <li
                            key={notification.id}
                            className="mb-4 pb-2 border-b border-gray-300 mx-4 flex items-center"
                          >
                            {/* Bolinha azul para indicar se a notificação foi vista */}
                            {!notification.visto && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            )}
                            <span className="flex-1">{notification.texto}</span>
                            {/* Ícone de redirecionamento */}
                            <Link
                              href={notification.link}
                              className="text-blue-500 hover:text-blue-700 mr-2"
                              onClick={async () => {
                                await handleMarkAsRead(notification.id);
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-6 h-6"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                              </svg>
                            </Link>
                            {/* Ícone de exclusão */}
                            <button
                              onClick={() => {
                                const confirmDelete = window.confirm(
                                  'Tem certeza de que deseja excluir esta notificação?'
                                );
                                if (confirmDelete) {
                                  handleDeleteNotification(notification.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-6 h-6"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer fixo do modal */}
                    <div className="bg-blue-900 text-white px-4 py-3 rounded-b-lg flex justify-between items-center sticky bottom-0">
                      {/* Botão "Marcar tudo como visto" */}
                      <button
                        onClick={handleMarkAllAsRead}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-600 transition duration-300 flex items-center"
                      >
                        {/* Ícone ao lado esquerdo */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-5 h-5 mr-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Marcar tudo como visto
                      </button>

                      {/* Botão "Esvaziar" */}
                      <button
                        onClick={() => {
                          const confirmClear = window.confirm(
                            'Tem certeza de que deseja excluir todas as notificações?'
                          );
                          if (confirmClear) {
                            handleClearNotifications();
                          }
                        }}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600 transition duration-300 flex items-center"
                      >
                        {/* Ícone ao lado esquerdo */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-5 h-5 mr-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                        Esvaziar
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </li>

        {/* Logout */}
        <li className="ml-[-20px] mt-6">
          <button
            onClick={handleLogout}
            className="flex items-center hover:bg-red-500 hover:text-white py-2 px-4 rounded w-full transition duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
              />
            </svg>
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
