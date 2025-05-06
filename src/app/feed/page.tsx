'use client'

import React, { useState, Suspense } from 'react'
import TableAtvUser from '@/components/colaborador/table-atv-user'

export default function TestePage() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold my-4">Minhas Atividades</h1>
      <Suspense fallback={<div>Carregando atividades...</div>}>
        <TableAtvUser />
      </Suspense>
    </main>
  )
}
