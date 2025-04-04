'use client';

import { useRouter } from 'next/navigation'; // Para redirecionar o usuário
import { motion } from 'framer-motion'; // Importando o Framer Motion

const ErrorPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#00a830] to-[#212529] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Usando motion.div para animar o card */}
      <motion.div
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-2xl border border-gray-200 text-center"
        initial={{ opacity: 0, y: 50 }} // Inicializa com o card invisível e abaixo
        animate={{ opacity: 1, y: 0 }} // Anima para opacidade total e posição original
        transition={{ duration: 0.8, ease: 'easeOut' }} // Duração e tipo de easing da animação
      >
        <h2 className="text-2xl font-bold text-[#212529] mb-4">Você não está logado.</h2>
        <p className="text-[#212529] mb-4">Para acessar a página de produtos, faça login.</p>
        <button
          onClick={() => router.push('/login')} // Redireciona para a página de login
          className="w-full py-3 px-4 bg-[#00a830] text-white font-semibold rounded-lg hover:bg-[#007a1a] focus:outline-none focus:ring-4 focus:ring-[#00a830] transition-all"
        >
          Fazer Login
        </button>
      </motion.div>
    </div>
  );
};

export default ErrorPage;
