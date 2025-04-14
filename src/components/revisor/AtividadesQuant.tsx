'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const Quant = ({ userId }: { userId: string }) => {
  const [concluidas, setConcluidas] = useState(0);
  const [pendentes, setPendentes] = useState(0);
  const [atrasadas, setAtrasadas] = useState(0);
  const [emAndamento, setEmAndamento] = useState(0);

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const { data, error } = await supabase
          .from('atividades')
          .select('id, status')
          .eq('user_id', userId);

        if (error) throw new Error(error.message);

        setConcluidas(data.filter(a => a.status === 'Concluída').length);
        setPendentes(data.filter(a => a.status === 'Pendente').length);
        setAtrasadas(data.filter(a => a.status === 'Atrasada').length);
        setEmAndamento(data.filter(a => a.status === 'Em Progresso').length);
      } catch (err) {
        console.error('Erro ao buscar atividades:', err);
      }
    };

    fetchAtividades();
  }, [userId]);

  return (
    <div className="flex flex-wrap justify-between gap-5 py-20">
      {/* Concluídas */}
      <Card
        title="Concluídas"
        count={concluidas}
        color="green"
        iconColor="green-500"
        iconPath="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
        viewBox="0 0 24 24"
      />

      {/* Pendentes */}
      <Card
        title="Pendentes"
        count={pendentes}
        color="yellow"
        iconColor="yellow-500"
        iconPath="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
        viewBox="0 0 24 24"
      />

      {/* Atrasadas */}
      <Card
        title="Atrasadas"
        count={atrasadas}
        color="red"
        iconColor="red-500"
        iconPath="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
        viewBox="0 0 24 24"
      />

      {/* Em Andamento */}
      <Card
        title="Em Andamento"
        count={emAndamento}
        color="blue"
        iconColor="blue-500"
        iconPath="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
        viewBox="0 0 20 20"
      />
    </div>
  );
};

// Componente reutilizável para cada card
const Card = ({
  title,
  count,
  color,
  iconColor,
  iconPath,
  viewBox,
}: {
  title: string;
  count: number;
  color: string;
  iconColor: string;
  iconPath: string;
  viewBox: string;
}) => (
  <div className={`bg-${color}-500 text-white p-6 rounded-lg w-55 h-24 flex items-center gap-4 shadow-md relative justify-between`}>
    {/* Título e contador à direita */}
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xl font-bold">{count}</p>
    </div>
    
    {/* Ícone do lado esquerdo */}
    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={`w-6 h-6 text-${iconColor}`} viewBox={viewBox}>
        <path fillRule="evenodd" d={iconPath} clipRule="evenodd" />
      </svg>
    </div>
  </div>
);

export default Quant;
