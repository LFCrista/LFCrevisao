'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './revisao/src/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Link from 'next/link';

type User = {
  email: string;
  admin: boolean;
} | null;

type Notification = {
  id: string;
  texto: string;
  link: string;
  visto?: boolean;
};

const Header = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bellPosition, setBellPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [user, setUser] = useState<User>(null);
  const router = useRouter();

  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: loggedInUser } } = await supabase.auth.getUser();

      if (loggedInUser) {
        setUser({
          email: loggedInUser.email ?? '',
          admin: loggedInUser.role === 'admin',
        });
      } else {
        console.log('Usuário não autenticado');
        router.push('/login');
      }
    };

    fetchUser();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [router, isMenuOpen]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const userId = localStorage.getItem('user_id'); // Obtém o user_id do localStorage
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId); // Filtra as notificações pelo user_id

        if (error) {
          console.error('Erro ao buscar notificações:', error.message);
        } else {
          setNotifications(data || []); // Atualiza o estado com as notificações
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const checkNotificationPermission = async () => {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    };

    checkNotificationPermission();

    const userId = localStorage.getItem('user_id'); // Obtém o user_id do localStorage
    if (!userId) return;

    // Configura o canal Realtime para escutar novas notificações
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const notification = payload.new;

          // Verifica se a notificação é destinada ao usuário atual
          if (notification.user_id === userId) {
            // Exibe a notificação no sistema operacional
            if (Notification.permission === 'granted') {
              const systemNotification = new Notification('Nova Notificação', {
                body: notification.texto,
                icon: '/path/to/icon.png', // Substitua pelo caminho do ícone
              });

              // Redireciona ao clicar na notificação
              systemNotification.onclick = async () => {
                window.open(notification.link, '_blank'); // Abre o link em uma nova aba

                // Marca a notificação como vista
                await supabase
                  .from('notifications')
                  .update({ visto: true })
                  .eq('id', notification.id);

                // Atualiza o estado local
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === notification.id ? { ...n, visto: true } : n
                  )
                );
              };
            }

            // Atualiza o estado local com a nova notificação
            setNotifications((prev) => [{ id: notification.id, texto: notification.texto, link: notification.link, visto: notification.visto }, ...prev]);
          }
        }
      )
      .subscribe();

    // Cleanup ao desmontar o componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const openModal = () => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      const modalWidth = 400; // Largura do modal
      const screenWidth = window.innerWidth;

      // Calcula a posição do modal
      const left = rect.left + rect.width / 2 - modalWidth / 2;
      const adjustedLeft = Math.min(left, screenWidth - modalWidth - 16); // Garante que o modal não ultrapasse a tela
      const finalLeft = Math.max(adjustedLeft, 16); // Garante que o modal não fique fora da tela à esquerda

      setBellPosition({
        top: rect.top + rect.height, // Posição abaixo do sino
        left: finalLeft,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao tentar fazer logout:', error.message);
      } else {
        localStorage.clear();
        setUser(null);
        router.push('/login');
      }
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ visto: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error.message);
      } else {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId ? { ...notification, visto: true } : notification
          )
        );
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const userId = localStorage.getItem('user_id'); // Obtém o user_id do localStorage
      if (!userId) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId); // Exclui apenas as notificações do usuário

      if (error) {
        console.error('Erro ao limpar notificações:', error.message);
      } else {
        setNotifications([]); // Limpa o estado local das notificações
      }
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userId = localStorage.getItem('user_id'); // Obtém o user_id do localStorage
      if (!userId) return;

      const { error } = await supabase
        .from('notifications')
        .update({ visto: true })
        .eq('user_id', userId); // Atualiza apenas as notificações do usuário

      if (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error.message);
      } else {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, visto: true }))
        );
      }
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao excluir notificação:', error.message);
      } else {
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  };

  return (
    <header className="bg-[#212529] text-white p-4 flex items-center justify-between">
      {/* Botão do menu de hambúrguer */}
      <div className="cursor-pointer mr-4" onClick={toggleMenu}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-8 w-8"
          strokeWidth="2"
          style={{ color: '#00a830' }}
        >
          <path
            fillRule="evenodd"
            d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Título */}
      <div className="text-xl font-bold flex-1 text-left text-white">MyApp</div>

      {/* Notificações */}
      <div className="flex space-x-4">
        <div className="relative">
          <button ref={bellRef} onClick={openModal} className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
              style={{ color: '#00a830' }}
            >
              <path
                fillRule="evenodd"
                d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z"
                clipRule="evenodd"
              />
            </svg>
            {notifications.filter((n) => !n.visto).length > 0 && (
              <div className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {notifications.filter((n) => !n.visto).length}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Modal de notificações */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999]">
            {/* Fundo escuro com opacidade */}
            <div
              className="absolute inset-0 bg-[rgba(0,0,0,0.5)]"
              onClick={closeModal} // Fecha o modal ao clicar no fundo
            ></div>

            {/* Modal de notificações */}
            <div
              className="absolute bg-white w-[400px] h-[400px] rounded-lg shadow-lg flex flex-col z-[10000]"
              style={{
                top: `${bellPosition.top}px`,
                left: `${bellPosition.left}px`,
              }}
            >
              {/* Seta apontando para o sino */}
              <div
                className="absolute -top-3 right-4 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"
              ></div>

              {/* Header fixo do modal */}
              <div className="bg-blue-900 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
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

              {/* Corpo do modal */}
              <div className="p-6 overflow-y-auto flex-1 text-black">
                <ul>
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="mb-4 pb-2 border-b border-gray-300 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        {/* Bolinha azul para indicar que a notificação não foi vista */}
                        {!notification.visto && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        )}
                        <span className="flex-1">{notification.texto}</span>
                      </div>
                      <div className="flex space-x-2">
                        {/* Botão para excluir a notificação */}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
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

                        {/* Botão para redirecionar para o link */}
                        <button
                          onClick={() => window.open(notification.link, '_blank')}
                          className="text-blue-500 hover:text-blue-700"
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
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer fixo do modal */}
              <div className="bg-blue-900 text-white px-4 py-3 rounded-b-lg flex justify-between items-center">
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
                  className="bg-red-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-red-600 transition duration-300 flex items-center justify-center w-40"
                >
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

                {/* Botão "Ver tudo" */}
                <button
                  onClick={handleMarkAllAsRead}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-green-600 transition duration-300 flex items-center justify-center w-40"
                >
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
                  Ver tudo
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Menu de hambúrguer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Fundo escuro com opacidade */}
            <motion.div
              className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-40"
              onClick={() => setIsMenuOpen(false)} // Fecha o menu ao clicar no fundo
              initial={{ opacity: 0 }} // Animação inicial
              animate={{ opacity: 1 }} // Animação ao aparecer
              exit={{ opacity: 0 }} // Animação ao sair
              transition={{ duration: 0.3 }} // Duração da animação
            ></motion.div>

            {/* Sidebar com animação */}
            <motion.div
              ref={menuRef}
              className="fixed top-0 left-0 h-full w-64 bg-[#212529] text-white flex flex-col items-center justify-between z-50 shadow-lg p-4"
              initial={{ x: '-100%' }} // Começa fora da tela à esquerda
              animate={{ x: 0 }} // Anima para a posição final (visível)
              exit={{ x: '-100%' }} // Sai para fora da tela à esquerda
              transition={{ duration: 0.3 }} // Duração da animação
            >
              {/* Nome do usuário logado */}
              <div className="mt-8 font-bold text-center text-lg">
                {user?.email ? `Bem-vindo, ${user.email}` : 'Carregando...'}
              </div>

              {/* Botão de sair */}
              <button
                onClick={handleLogout}
                className="mt-auto mb-8 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition duration-300"
              >
                Sair
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
