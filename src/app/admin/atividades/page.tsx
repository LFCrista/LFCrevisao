// src/app/list/page.tsx
"use client"

import React from 'react'
import ListAtv from '@/components/list-atv'
import { withAuth } from '@/lib/auth'

const AtividadeList = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lista de Atividades</h1>
      <ListAtv /> {/* Aqui estamos inserindo o componente ListAtv */}
    </div>
  )
}

export default withAuth(AtividadeList)
