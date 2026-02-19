import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface ColumnDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialTitle?: string
    onSubmit: (title: string) => void
}

export default function ColumnDialog({
    open,
    onOpenChange,
    initialTitle = '',
    onSubmit,
}: ColumnDialogProps) {
    const isEditing = !!initialTitle
    const [title, setTitle] = useState('')

    useEffect(() => {
        if (open) {
            setTitle(initialTitle)
        }
    }, [open, initialTitle])

    function handleSubmit() {
        if (!title.trim()) return
        onSubmit(title.trim())
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[360px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar coluna' : 'Nova coluna'}</DialogTitle>
                    <DialogDescription className="sr-only">
                        {isEditing ? 'Formulário para editar o nome da coluna' : 'Formulário para criar uma nova coluna'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="col-title">Nome</Label>
                        <Input
                            id="col-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Em Revisão"
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit}>
                        {isEditing ? 'Salvar' : 'Criar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
