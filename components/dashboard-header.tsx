'use client'

import { usePathname } from "next/navigation"

const titleMap: Record<string, string> = {
    "/dashboard": "Inicio",
    "/dashboard/contactos": "Contactos",
    "/dashboard/communities": "Comunidades",
    "/dashboard/tasks": "Tareas",
    "/dashboard/communications": "Bandeja de Entrada",
    "/dashboard/documents": "Documentos",
    "/dashboard/assistant": "Asistente AI",
    "/dashboard/admin/users": "Gestión Usuarios",
}

export function DashboardHeader() {
    const pathname = usePathname()
    // Dynamic match for exact paths, could add logic for subpaths
    const title = titleMap[pathname] || "Mi Hogar"

    return (
        <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-muted-foreground">{title}</h1>
        </div>
    )
}
