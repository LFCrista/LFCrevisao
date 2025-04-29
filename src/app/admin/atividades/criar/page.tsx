"use client";

import React from 'react'
import { FormAtv } from "@/components/admin/form-atv"
import { withAuth } from '@/lib/auth'

function CriarAtvPage() {
  return (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Cadastrar Nova Atividade</h1>
          {/* Aqui estamos inserindo o FormAtv, que é o componente de formulário */}
          <FormAtv />
        </div>
  )
}

export default withAuth(CriarAtvPage);
