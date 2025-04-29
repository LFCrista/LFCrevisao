"use client";
import TableColab from "@/components/admin/table-colab"
import { withAuth } from '@/lib/auth'

const ColabList = () => {
    return (
        <div className="container mx-auto p-4">
          <h1>Colaboradores</h1>
        <TableColab />
        </div>
    )
}

export default withAuth(ColabList)