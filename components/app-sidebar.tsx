import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import {
    Home,
    Building,
    Inbox,
    CheckSquare,
    FileText,
    Settings,
    Bot,
    LogOut,
    Users,
    ChevronsUpDown,
    Search,
    Bell,
    LayoutGrid
} from "lucide-react"
import Link from "next/link"
import { signOut } from "@/lib/actions/auth"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { Community } from "@/types"

// Menu items grouped
const mainNav = [
    {
        title: "Inicio",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Tareas",
        url: "/dashboard/tasks",
        icon: CheckSquare,
    },
    {
        title: "Comunicaciones",
        url: "/dashboard/communications",
        icon: Inbox,
    },
]

const objectsNav = [
    {
        title: "Personas",
        url: "/dashboard/contactos",
        icon: Users,
    },
    {
        title: "Documentos",
        url: "/dashboard/documents",
        icon: FileText,
    },
]

const toolsNav = [
    {
        title: "Asistente AI",
        url: "/dashboard/assistant",
        icon: Bot,
    },
]

export function AppSidebar({ isAdmin, communities = [] }: { isAdmin?: boolean; communities?: Community[] }) {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex h-[--header-height] items-center px-4">
                    <div className="flex items-center gap-2 font-medium">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <LayoutGrid className="size-4" />
                        </div>
                        <span className="truncate group-data-[collapsible=icon]:hidden">Mi Hogar</span>
                    </div>
                </div>

                {/* Search / Config quick links similar to Twenty logic if needed, or just keep it simple */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="text-muted-foreground">
                            <Search className="size-4" />
                            <span>Buscar</span>
                            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="text-muted-foreground">
                            <Settings className="size-4" />
                            <span>Configuración</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Espacio de trabajo</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {objectsNav.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Comunidades</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {communities.map((community) => (
                                <SidebarMenuItem key={community.id}>
                                    <SidebarMenuButton asChild tooltip={community.name}>
                                        <Link href={`/dashboard/communities/${community.id}`}>
                                            <Building className="text-muted-foreground/70" />
                                            <span>{community.name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Ver todas">
                                    <Link href="/dashboard/communities">
                                        <ChevronsUpDown className="size-4" />
                                        <span>Ver todas</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>General</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNav.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            {/* Explicit check for admin */}
                            {isAdmin === true && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Gestión Usuarios">
                                        <Link href="/dashboard/admin/users">
                                            <Users />
                                            <span>Gestión Usuarios</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {toolsNav.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={async () => {
                            'use server'
                            await signOut()
                        }} tooltip="Cerrar Sesión">
                            <LogOut />
                            <span>Cerrar Sesión</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
