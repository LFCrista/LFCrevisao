"use client";

import { FormUser } from "@/components/admin/form-user" // Ajuste o caminho conforme necessário
import { withAuth } from '@/lib/auth'


function ColaboradoresPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Cadastrar Novo Colaborador</h1>

      {/* Aqui você chama o componente de cadastro de usuário */}
      <FormUser />
    </div>
  )
}

export default withAuth(ColaboradoresPage);
