'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import Quant from '@/components/dashboard/Quant';
import Grafico from '@/components/dashboard/Graf';
import ListEnv from '@/components/dashboard/List.env';
import ListRecb from '@/components/dashboard/List.Recb';
import { withAuth } from '../../lib/auth';

const Dashboard = () => {
  return (
    <div className="flex h-screen">
      <div className="h-screen fixed left-0 top-0">
        <Sidebar />
      </div>

      {/* Conteúdo principal com scroll */}
      <div className="ml-50 flex-1 overflow-y-auto h-screen ">
        {/* Primeira Linha - Gráfico + Quant */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white rounded-lg p-4">
            <Grafico />
          </div>
          <div className="flex-1 bg-white rounded-lg p-4">
            <Quant />
          </div>
        </div>

        {/* Segunda Linha - Listas lado a lado */}
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 bg-white rounded-lg p-4">
            <ListEnv />
          </div>
          <div className="flex-1 bg-white rounded-lg p-4">
            <ListRecb />
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(Dashboard);
