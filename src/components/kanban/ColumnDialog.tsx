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
import type { Column } from '@/types'

const COLUMN_COLORS = [
    '#6366F1', '#3B82F6', '#06B6D4', '#10B981',
    '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
    '#64748B',
]

interface ColumnDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    column?: Column | null
    onSubmit: (title: string, color: string) => void
}

export default function ColumnDialog({
    open,
    onOpenChange,
    column,
    onSubmit,
}: ColumnDialogProps) {
    const isEditing = !!column
    const [title, setTitle] = useState('')
    const [color, setColor] = useState(COLUMN_COLORS[0])

    useMemo(() => {
        if (open) {
            if (column) {
                setTitle(column.title)
                setColor(column.color)
            } else {
                setTitle('')
                setColor(COLUMN_COLORS[0])
            }
        }
    }, [open, column])

    function handleSubmit() {
        if (!title.trim()) return
        onSubmit(title.trim(), color)
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
