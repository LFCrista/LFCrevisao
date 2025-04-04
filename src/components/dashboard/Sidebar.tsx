'use client'; // Marca o componente para ser renderizado no cliente

import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // Certifique-se de importar o Supabase

const Sidebar = () => {
  // Função para realizar o logout
  const handleLogout = async () => {
    try {
      // Realizando o logout no Supabase
      await supabase.auth.signOut();
      
      // Limpando TODOS os dados do localStorage
      localStorage.clear(); // Isso remove todos os itens armazenados no localStorage

      // Redirecionando o usuário após o logout (você pode personalizar a URL)
      window.location.href = '/login'; // Ou a página que deseja redirecionar
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Se o erro for uma instância de Error, podemos acessar 'message'
        console.error('Erro ao realizar logout:', error.message);
      } else {
        // Caso o erro não seja uma instância de Error, apenas logamos uma mensagem genérica
        console.error('Erro ao realizar logout:', error);
      }
    }
  };

  return (
    <div className="w-48 bg-gray-800 text-white p-6 h-screen">
      {/* Título da Sidebar */}
      <div className="flex items-center text-xl font-bold mb-8">
        <span>Dev</span>
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
      <ul> {/* Removendo a margem do ul e deixando os links colados à esquerda */}
        {/* Dashboard */}
        <li className='ml-[-20px]'>
          <Link
            href="/admin"
            className="flex items-center hover:bg-green-500 hover:text-white py-2 px-4 rounded w-full transition duration-300"
          >
            {/* Ícone de Dashboard */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 mr-2" // Ícone menor e mais próximo do texto
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
        <li className='ml-[-20px]'>
          <Link
            href="/admin/atividades"
            className="flex items-center hover:bg-green-500 hover:text-white py-2 px-4 rounded w-full transition duration-300"
          >
            {/* Ícone de Atividades */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 mr-2" // Ícone menor e mais próximo do texto
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
        <li className='ml-[-20px]'>
          <Link
            href="/admin/revisores"
            className="flex items-center hover:bg-green-500 hover:text-white py-2 px-4 rounded w-full transition duration-300"
          >
            {/* Ícone de Revisores */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                fillRule="evenodd"
                d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z"
                clipRule="evenodd"
              />
              <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
            </svg>
            Revisores
          </Link>
        </li>

        {/* Logout */}
        <li className='ml-[-20px] mt-6'>
          <button
            onClick={handleLogout}
            className="flex items-center hover:bg-red-500 hover:text-white py-2 px-4 rounded w-full transition duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mr-2 ">
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
</svg>

            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
