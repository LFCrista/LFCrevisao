import React, { useEffect, useState } from 'react';
import { supabase } from './supabase'; // Certifique-se de que o Supabase esteja configurado corretamente
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation'; // Importando o hook usePathname

// Função para verificar o estado de autenticação do usuário
export async function checkAuth() {
  // Verifica se a sessão está armazenada no localStorage
  if (typeof window !== 'undefined') {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const userId = localStorage.getItem('userId');
    if (isLoggedIn && userId) {
      return { loggedIn: true, isAdmin };
    }
  }

  // Tenta obter a sessão do Supabase
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Se o usuário não estiver logado, retorna loggedIn false
    return { loggedIn: false, isAdmin: false };
  }

  // Tenta obter as informações do usuário na tabela 'users'
  const { data: user, error } = await supabase
    .from('users')
    .select('admin, user_id') // Buscando admin e user_id
    .eq('user_id', session.user.id) // Comparando o user_id com o id do usuário autenticado
    .single();

  if (error || !user) {
    // Caso o usuário não exista na tabela ou tenha erro, retorna loggedIn false
    return { loggedIn: false, isAdmin: false };
  }

  // Salvar no localStorage se está logado e se é admin
  if (typeof window !== 'undefined') {
    localStorage.setItem('isLoggedIn', JSON.stringify(true));
    localStorage.setItem('isAdmin', JSON.stringify(user.admin));
    localStorage.setItem('userId', JSON.stringify(session.user.id));
  }

  // Retorna se está logado e se é admin
  return { loggedIn: true, isAdmin: user.admin };
}

// HOC para proteger rotas com autenticação
export function withAuth(Component: React.ComponentType<any>) {
  return function ProtectedRoute(props: any) {
    const router = useRouter();
    const pathname = usePathname(); // Usando usePathname para obter o caminho atual
    const [authState, setAuthState] = useState<{ loggedIn: boolean; isAdmin: boolean } | null>(null);

    useEffect(() => {
      const checkUserAuth = async () => {
        const { loggedIn, isAdmin } = await checkAuth();

        // Se não estiver logado, redireciona para login
        if (!loggedIn) {
          router.push('/login');
        } 
        // Se o usuário não for admin e está tentando acessar rota '/admin', redireciona
        else if (!isAdmin && pathname.startsWith('/admin')) {
          router.push('/feed'); // Redireciona para a página de feed ou qualquer outra que você deseje
        } 
        else {
          setAuthState({ loggedIn, isAdmin });
        }
      };

      checkUserAuth();
    }, [pathname]); // Dependendo do pathname, o useEffect é chamado novamente.

    // Se ainda está verificando o estado de autenticação, exibe "Loading..."
    if (authState === null) {
      return <div>Loading...</div>;
    }

    // Quando a autenticação for verificada, renderiza o componente protegido
    return <Component {...props} />;
  };
}
