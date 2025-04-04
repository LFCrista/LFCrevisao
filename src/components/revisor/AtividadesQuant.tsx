// components/revisor/Quant.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const Quant = ({ userId }: { userId: string }) => {
  const [concluidas, setConcluidas] = useState(0); // Contagem de atividades concluídas
  const [pendentes, setPendentes] = useState(0); // Contagem de atividades pendentes
  const [atrasadas, setAtrasadas] = useState(0); // Contagem de atividades atrasadas

  useEffect(() => {
    // Função para buscar as atividades e contar conforme o status
    const fetchAtividades = async () => {
      try {
        const { data, error } = await supabase
          .from('atividades')
          .select('id, concluida, end_date')
          .eq('user_id', userId) // Filtro para atividades do revisor
          .order('created_at', { ascending: false }); // Ordenando por data de criação

        if (error) {
          console.error('Erro ao buscar atividades:', error.message || error);
          throw new Error(error.message || 'Erro ao buscar atividades');
        }

        // Contagem das atividades com base no status
        const countConcluidas = data.filter(atividade => atividade.concluida === true).length;
        const countPendentes = data.filter(
          atividade => atividade.concluida === false && new Date(atividade.end_date) > new Date()
        ).length;
        const countAtrasadas = data.filter(
          atividade => atividade.concluida === false && new Date(atividade.end_date) < new Date()
        ).length;

        // Atualizando os estados com as contagens
        setConcluidas(countConcluidas);
        setPendentes(countPendentes);
        setAtrasadas(countAtrasadas);
      } catch (error) {
        console.error('Erro ao buscar atividades:', error);
      }
    };

    fetchAtividades();
  }, [userId]); // O hook será acionado toda vez que o userId mudar

  return (
    <div className="flex justify-between gap-5 py-20">
      {/* Quadrado retangular para atividades Concluídas */}
      <div className="bg-green-500 text-white p-6 rounded-lg w-40 h-24 flex flex-col items-start justify-center shadow-md relative">
        <h3 className="text-sm font-semibold">Concluídas</h3>
        <p className="text-xl font-bold">{concluidas}</p>
        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
          {/* Ícone para Concluídas */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-500">
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Quadrado retangular para atividades Pendentes */}
      <div className="bg-yellow-500 text-white p-6 rounded-lg w-40 h-24 flex flex-col items-start justify-center shadow-md relative">
        <h3 className="text-sm font-semibold">Pendentes</h3>
        <p className="text-xl font-bold">{pendentes}</p>
        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
          {/* Ícone para Pendentes */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-yellow-500">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Quadrado retangular para atividades Atrasadas */}
      <div className="bg-red-500 text-white p-6 rounded-lg w-40 h-24 flex flex-col items-start justify-center shadow-md relative">
        <h3 className="text-sm font-semibold">Atrasadas</h3>
        <p className="text-xl font-bold">{atrasadas}</p>
        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
          {/* Ícone para Atrasadas */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Quant;
