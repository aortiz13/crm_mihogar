import { toast } from 'sonner'
import { sendNewEmail } from '@/lib/actions/communications'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, Link as LinkIcon, Paperclip, Sparkles, Send, Check, ChevronsUpDown } from "lucide-react"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Contact } from '@/types'
import { Community } from '@/types' // Or wherever Community is defined if not in types/index

interface ComposeEmailModalProps {
    children?: React.ReactNode
    communities: Community[]
    contacts: Contact[]
}

export function ComposeEmailModal({ children, communities, contacts }: ComposeEmailModalProps) {
    const [open, setOpen] = React.useState(false)
    const [subject, setSubject] = React.useState("")
    const [body, setBody] = React.useState("")

    // Sender State
    const [selectedCommunityId, setSelectedCommunityId] = React.useState<string>("")

    // Recipient State
    const [recipientOpen, setRecipientOpen] = React.useState(false)
    const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null)
    const [recipientEmail, setRecipientEmail] = React.useState("") // Allow manual override

    // File Attachment State
    const [files, setFiles] = React.useState<File[]>([])
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    // Initialize default community if available
    React.useEffect(() => {
        if (communities.length > 0 && !selectedCommunityId) {
            setSelectedCommunityId(communities[0].id)
        }
    }, [communities, selectedCommunityId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedCommunityId) {
            toast.error("Por favor selecciona una comunidad remitente")
            return
        }
        if (!recipientEmail) {
            toast.error("Por favor ingresa un destinatario")
            return
        }

        const toastId = toast.loading("Enviando correo...")

        try {
            const formData = {
                communityId: selectedCommunityId,
                to: recipientEmail,
                subject,
                body,
                // Files not yet supported in backend action, ensuring we don't break
            }

            const result = await sendNewEmail(formData)

            if (result.error) {
                toast.error("Error al enviar", { description: result.error, id: toastId })
            } else {
                toast.success("Correo enviado exitosamente", { id: toastId })
                setOpen(false)
                // Reset state
                setSubject("")
                setBody("")
                setFiles([])
                setRecipientEmail("")
                setSelectedContact(null)
            }
        } catch (error) {
            console.error(error)
            toast.error("Error inesperado al enviar", { id: toastId })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button className="w-full gap-2"><Send className="h-4 w-4" /> Redactar</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Mensaje</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* FROM Field */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="from" className="text-right">
                            De:
                        </Label>
                        <div className="col-span-3">
                            <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar remitente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {communities.map((community) => (
                                        <SelectItem key={community.id} value={community.id}>
                                            {community.name} {community.contact_info?.email ? `<${community.contact_info.email}>` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* TO Field */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="to" className="text-right">
                            Para:
                        </Label>
                        <div className="col-span-3">
                            <Popover open={recipientOpen} onOpenChange={setRecipientOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={recipientOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {selectedContact
                                            ? `${selectedContact.full_name} <${selectedContact.email || 'Sin email'}>`
                                            : recipientEmail || "Buscar contacto o escribir email..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar persona..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron personas.</CommandEmpty>
                                            <CommandGroup>
                                                {contacts.map((contact) => (
                                                    <CommandItem
                                                        key={contact.id}
                                                        value={contact.full_name}
                                                        onSelect={() => {
                                                            setSelectedContact(contact)
                                                            setRecipientEmail(contact.email || "")
                                                            setRecipientOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedContact?.id === contact.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{contact.full_name}</span>
                                                            <span className="text-xs text-muted-foreground">{contact.email}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {/* Hidden input or just handle state manually if user wants to type arbitrary email not in list? 
                                For now, assuming selection, but could add manual override logic if requested 
                            */}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subject" className="text-right">
                            Asunto:
                        </Label>
                        <Input
                            id="subject"
                            className="col-span-3"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        <Textarea
                            id="body"
                            className="min-h-[200px]"
                            placeholder="Escribe tu mensaje aquí..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                        {/* Selected Files Display */}
                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />
                </form>
                <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                    <div className="flex gap-1 text-muted-foreground">
                        <Button variant="ghost" size="icon" title="Negrita"><Bold className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Cursiva"><Italic className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Enlace"><LinkIcon className="h-4 w-4" /></Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Adjuntar"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-2 mr-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <Label htmlFor="ai-mode" className="text-xs font-normal text-muted-foreground cursor-pointer">Instant AI</Label>
                        </div>
                        <Button type="submit" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Enviar</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
