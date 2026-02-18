import { useState, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { GetColumns200ColumnsItem as Column } from '@/lib/api/model'

interface ColumnDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    column?: Column | null // Use partial to allow local mock color if needed, but here we just need title and id
    onSubmit: (title: string) => void
}

export default function ColumnDialog({
    open,
    onOpenChange,
    column,
    onSubmit,
}: ColumnDialogProps) {
    const isEditing = !!column
    const [title, setTitle] = useState('')

    useMemo(() => {
        if (open) {
            if (column) {
                setTitle(column.title)
            } else {
                setTitle('')
            }
        }
    }, [open, column])

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
