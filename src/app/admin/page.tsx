'use client'; // Marca o componente para ser renderizado no cliente

import Sidebar from '@/components/dashboard/Sidebar'; // Sidebar separada
import Quant from '@/components/dashboard/Quant'; // Componente Quant para a direita
import Grafico from '@/components/dashboard/Graf'; // Seu componente de gráfico
import ListEnv from '@/components/dashboard/List.env'; // Componente List.env.tsx
import ListRecb from '@/components/dashboard/List.Recb'; // Componente List.Recb.tsx
import { withAuth } from '../../lib/auth'

const Dashboard = () => {
  return (
    <div className="flex h-screen overflow-hidden"> {/* Flexbox para o layout inteiro */}
      {/* Sidebar */}
      <Sidebar/>

      <div className="flex flex-col w-full p-4"> {/* Área principal com flex-col e padding reduzido */}
        {/* Primeira Linha - Gráfico + Quant */}
        <div className="flex justify-between gap-4 mb-4"> {/* Linha de cima com flexbox e espaçamento reduzido */}
          {/* Gráfico */}
          <div className="flex-1 bg-white rounded-lg ">
            <Grafico /> {/* Seu componente de gráfico aqui */}
          </div>

          {/* Quant */}
          <div className="flex-1 bg-white p-8 rounded-lg ">
            <Quant /> {/* Seu componente Quant aqui */}
          </div>
        </div>

        {/* Segunda Linha - Listas lado a lado */}
        <div className="flex justify-between gap-4">
          {/* Lista 1 (ListEnv) */}
          <div className="flex-1 bg-white rounded-lg ">
            <ListEnv /> {/* Componente ListEnv */}
          </div>

          {/* Lista 2 (ListRecb) */}
          <div className="flex-1 bg-white  rounded-lg ">
            <ListRecb /> {/* Componente ListRecb */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(Dashboard);
