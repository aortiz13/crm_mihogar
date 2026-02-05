'use client'

import React, { useState } from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getFilteredRowModel,
    ColumnFiltersState,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Contact } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Search, Download, Filter, ChevronRight, ChevronDown, Check } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CreateContactDialog } from './create-contact-dialog'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

export const columns: ColumnDef<Contact>[] = [
    {
        accessorKey: "full_name",
        header: "Nombre",
        cell: ({ row }) => {
            const contact = row.original
            return (
                <Link href={`/dashboard/contactos/${contact.id}`} className="flex items-center gap-3 hover:underline">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={contact.avatar_url || ''} />
                        <AvatarFallback>{contact.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{contact.full_name}</span>
                        <span className="text-xs text-muted-foreground">{contact.email}</span>
                    </div>
                </Link>
            )
        }
    },
    {
        accessorKey: "email",
        header: "Email",
        // Hidden by default in simple view, used for filtering
        size: 0,
        cell: ({ row }) => null, // We display email in the name column
        enableHiding: true,
    },
    {
        accessorKey: "phone",
        header: "Teléfono",
    },
    {
        accessorKey: "communities.name",
        id: "community_name", // explicit ID
        header: "Comunidad",
        accessorFn: (row) => row.communities?.name || 'Sin asignar'
    },
    {
        accessorKey: "unit_number",
        header: "Unidad",
        accessorFn: (row) => row.unit_number || ''
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/contactos/${row.original.id}`}>Ver Detalles</Link>
                </Button>
            )
        }
    }
]

interface ContactTableProps {
    data: Contact[]
    communities: { id: string, name: string }[]
}

export function ContactTable({ data, communities }: ContactTableProps) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            columnFilters,
            globalFilter,
        },
        initialState: {
            columnVisibility: {
                email: false // Hide email column as it's shown in name
            }
        }
    })

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const handleExportCSV = () => {
        const header = ["Nombre", "Email", "Teléfono", "Comunidad", "Unidad"]
        const csvRows = [
            header.join(','),
            ...data.map(row => [
                `"${row.full_name}"`,
                `"${row.email || ''}"`,
                `"${row.phone || ''}"`,
                `"${row.communities?.name || ''}"`,
                `"${row.unit_number || ''}"`
            ].join(','))
        ]

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contactos-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    // Filter Logic
    const activeFiltersCount = columnFilters.length

    return (
        <div className="w-full">
            <div className="flex items-center py-4 gap-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre..."
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className={cn(activeFiltersCount > 0 && "bg-blue-50 border-blue-200 text-blue-700")}>
                                <Filter className="mr-2 h-4 w-4" />
                                Filtros
                                {activeFiltersCount > 0 && <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">{activeFiltersCount}</Badge>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="end">
                            <div className="space-y-4">
                                <h4 className="font-medium leading-none">Filtrar Contactos</h4>
                                <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="email-filter">Email</Label>
                                    <Input
                                        id="email-filter"
                                        placeholder="Ej: gmail.com"
                                        value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                                        onChange={(event) =>
                                            table.getColumn("email")?.setFilterValue(event.target.value)
                                        }
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone-filter">Teléfono</Label>
                                    <Input
                                        id="phone-filter"
                                        placeholder="+56..."
                                        value={(table.getColumn("phone")?.getFilterValue() as string) ?? ""}
                                        onChange={(event) =>
                                            table.getColumn("phone")?.setFilterValue(event.target.value)
                                        }
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Comunidad</Label>
                                    <select
                                        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={(table.getColumn("community_name")?.getFilterValue() as string) ?? ""}
                                        onChange={(event) =>
                                            table.getColumn("community_name")?.setFilterValue(event.target.value)
                                        }
                                    >
                                        <option value="">Todas las comunidades</option>
                                        {communities.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit-filter">Unidad</Label>
                                    <Input
                                        id="unit-filter"
                                        placeholder="Ej: 405"
                                        value={(table.getColumn("unit_number")?.getFilterValue() as string) ?? ""}
                                        onChange={(event) =>
                                            table.getColumn("unit_number")?.setFilterValue(event.target.value)
                                        }
                                        className="h-8"
                                    />
                                </div>
                                {activeFiltersCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => table.resetColumnFilters()}
                                    >
                                        Borrar Filtros
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </Button>
                    <CreateContactDialog communities={communities} />
                </div>
            </div>
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                <TableHead className="w-[50px]"></TableHead>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <React.Fragment key={row.id}>
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        onClick={() => toggleRow(row.id)}
                                        className="cursor-pointer hover:bg-muted/50"
                                    >
                                        <TableCell>
                                            {expandedRows[row.id] ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                        </TableCell>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {expandedRows[row.id] && (
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableCell colSpan={columns.length + 1}>
                                                <div className="p-4 flex gap-4 text-sm">
                                                    <div className="grid gap-1">
                                                        <span className="font-semibold text-muted-foreground text-xs uppercase">Unidad</span>
                                                        <span>{row.original.unit_number || '-'}</span>
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <span className="font-semibold text-muted-foreground text-xs uppercase">Notas Recientes</span>
                                                        <span className="text-muted-foreground italic">No hay notas recientes.</span>
                                                    </div>
                                                    {/* Debug */}
                                                    <div className="grid gap-1">
                                                        <span className="font-semibold text-muted-foreground text-xs uppercase">ID</span>
                                                        <span className="text-xs font-mono">{row.original.id}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                                    No se encontraron resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
