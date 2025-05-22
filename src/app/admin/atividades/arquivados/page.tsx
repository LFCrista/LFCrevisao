// src/app/list/page.tsx
"use client"

import React from 'react'
import ListArquivados from '@/components/admin/list-arquivados'
import { withAuth } from '@/lib/auth'

const AtvArquivados = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Atividades Arquivadas</h1>
      <ListArquivados /> {/* Aqui estamos inserindo o componente ListAtv */}
    </div>
  )
}

export default withAuth(AtvArquivados)
