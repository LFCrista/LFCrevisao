"use client"; // Garanta que este código seja executado no lado do cliente

import { useState } from 'react';
import { supabase } from '../../../../lib/supabase'; // Certifique-se de que seu arquivo supabase.ts esteja correto
import Sidebar from '../../../../components/dashboard/Sidebar'; // Importe a Sidebar
import { withAuth } from '../../../../lib/auth'

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Estado para armazenar o nome do usuário
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Chamada para o cadastro de usuário no Supabase, incluindo o nome nos metadados (user_metadata)
    const { error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            name: name, // Passando o nome corretamente dentro de "data"
          },
        },
      }
    );

    // Verifica se ocorreu um erro no cadastro
    if (signUpError) {
      setError(signUpError.message);
    } else {
      alert('Cadastro realizado com sucesso! Verifique seu e-mail.');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar /> {/* Aqui você inclui o componente Sidebar */}

      {/* Formulário de Cadastro */}
      <div className="flex-1 p-8 bg-gray-100">
        <div className="w-full max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-semibold text-center text-blue-600 mb-6">Cadastro</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default  withAuth(Signup) // Exportando no final
