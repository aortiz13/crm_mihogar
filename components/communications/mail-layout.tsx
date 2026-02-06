'use client'

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import React from 'react'
import { MailNav } from "./mail-nav"
import { Inbox, FileText, Send, Archive, Trash2, Users, Building } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { ComposeEmailModal } from "./compose-modal"
import { Button } from "@/components/ui/button"

import { Contact, Community } from "@/types"

export interface MailLayoutProps {
    children: React.ReactNode // Default Slot (or maybe List?)
    list?: React.ReactNode
    display?: React.ReactNode
    defaultLayout?: number[]
    navCollapsedSize?: number
    communities?: Community[]
    contacts?: Contact[]
}

// Hardcoded mock stats for now
const counts = {
    pending: 4,
    todo: 2,
    resolved: 12
}

export function MailLayout({
    defaultLayout = [20, 32, 48],
    navCollapsedSize = 4,
    list,
    display,
    communities = [],
    contacts = []
}: MailLayoutProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const searchParams = useSearchParams()
    const folder = searchParams.get('folder') || 'pending'

    const communityId = searchParams.get('communityId')
    const baseParams = communityId ? `&communityId=${communityId}` : ''

    const links = [
        {
            title: "Pendientes",
            label: counts.pending.toString(),
            icon: Inbox,
            variant: folder === 'pending' || folder === 'new' ? "default" : "ghost",
            href: `/dashboard/communications?folder=pending${baseParams}`,
        },
        {
            title: "En Proceso",
            label: counts.todo.toString(),
            icon: FileText,
            variant: folder === 'inprogress' ? "default" : "ghost",
            href: `/dashboard/communications?folder=inprogress${baseParams}`,
        },
        {
            title: "Resueltos",
            label: counts.resolved.toString(),
            icon: Archive,
            variant: folder === 'resolved' ? "default" : "ghost",
            href: `/dashboard/communications?folder=resolved${baseParams}`,
        },
        {
            title: "Papelera",
            icon: Trash2,
            variant: folder === 'trash' ? "default" : "ghost",
            href: `/dashboard/communications?folder=trash${baseParams}`,
        },
    ]

    return (
        <TooltipProvider delayDuration={0}>
            <ResizablePanelGroup
                direction="horizontal"
                onLayout={(sizes: number[]) => {
                    document.cookie = `react-resizable-panels:layout=${JSON.stringify(
                        sizes
                    )}`
                }}
                className="h-full max-h-[800px] items-stretch"
            >
                <ResizablePanel
                    defaultSize={defaultLayout[0]}
                    collapsedSize={navCollapsedSize}
                    collapsible={true}
                    minSize={15}
                    maxSize={20}
                    onCollapse={() => {
                        setIsCollapsed(true)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                            true
                        )}`
                    }}
                    onResize={() => {
                        setIsCollapsed(false)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                            false
                        )}`
                    }}
                    className={cn(isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}
                >
                    <div className="flex h-[52px] items-center justify-center px-2">
                        <ComposeEmailModal communities={communities} contacts={contacts}>
                            <Button variant="default" size={isCollapsed ? "icon" : "default"} className={cn("ml-auto w-full", isCollapsed && "w-9")}>
                                <Send className="h-4 w-4" />
                                <span className={cn("ml-2", isCollapsed && "hidden")}>Redactar</span>
                            </Button>
                        </ComposeEmailModal>
                    </div>
                    <Separator />
                    <MailNav
                        isCollapsed={isCollapsed}
                        links={links as any}
                    />
                    <Separator />
                    <div className={cn("flex h-[52px] items-center justify-center", isCollapsed ? 'h-[52px]' : 'px-2')}>
                        <h2 className={cn("font-bold text-sm", isCollapsed && "hidden")}>Comunidades</h2>
                    </div>
                    <MailNav
                        isCollapsed={isCollapsed}
                        links={communities.map(community => ({
                            title: community.name,
                            icon: Building,
                            variant: searchParams.get('communityId') === community.id ? "default" : "ghost",
                            href: `/dashboard/communications?communityId=${community.id}`,
                        }))}
                    />

                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
                    {list}
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider >
    )
}
