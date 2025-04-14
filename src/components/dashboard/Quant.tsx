'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const Quant = () => {
  const [concluidas, setConcluidas] = useState(0);
  const [pendentes, setPendentes] = useState(0);
  const [atrasadas, setAtrasadas] = useState(0);
  const [emProgresso, setEmProgresso] = useState(0);

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const { data, error } = await supabase
          .from('atividades')
          .select('id, status')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setConcluidas(data.filter(a => a.status === 'Concluída').length);
        setPendentes(data.filter(a => a.status === 'Pendente').length);
        setAtrasadas(data.filter(a => a.status === 'Atrasada').length);
        setEmProgresso(data.filter(a => a.status === 'Em Progresso').length);
      } catch (error) {
        console.error('Erro ao buscar atividades:', error);
      }
    };

    fetchAtividades();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
      <Card title="Concluídas" count={concluidas} color="green" icon={<CheckIcon className="text-green-500" />} />
      <Card title="Pendentes" count={pendentes} color="yellow" icon={<ClockIcon className="text-yellow-500" />} />
      <Card title="Atrasadas" count={atrasadas} color="red" icon={<WarningIcon className="text-red-500" />} />
      <Card title="Em Progresso" count={emProgresso} color="blue" icon={<ProgressIcon className="text-blue-500" />} />
    </div>
  );
};

// Card reutilizável
const Card = ({ title, count, color, icon }: any) => {
  return (
    <div className={`bg-${color}-500 text-white p-5 rounded-lg w-32 h-28 flex flex-col justify-center shadow-md relative items-center`}>
      <h3 className="text-sm font-semibold whitespace-nowrap">{title}</h3>
      <div className='flex justify-center items-center'>
        <p className="text-2xl mr-5 ">{count}</p>
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
          {icon}
        </div>
      </div>
      
    </div>
  );
};

// Ícones
const CheckIcon = (props: any) => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = (props: any) => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
  </svg>
);

const WarningIcon = (props: any) => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
  </svg>
);

const ProgressIcon = (props: any) => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
  </svg>
);

export default Quant;
