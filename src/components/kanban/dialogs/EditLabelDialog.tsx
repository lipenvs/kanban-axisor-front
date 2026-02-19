import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog'
import { Label } from '../../ui/label'
import { Input } from '../../ui/input'
import { Button } from '../../ui/button'
import { usePutLabelsByIdWithJson, getGetLabelsByProjectIdQueryKey } from '@/lib/api/label'
import { useQueryClient } from '@tanstack/react-query'

const CATEGORY_COLORS = [
  '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F59E0B',
  '#EC4899', '#06B6D4', '#84CC16',
]

interface EditLabelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  label: { id: string; name: string; color: string; projectId: string }
}

export function EditLabelDialog({
  open,
  onOpenChange,
  label,
}: EditLabelDialogProps) {
  const [labelName, setLabelName] = useState(label.name)
  const [labelColor, setLabelColor] = useState(label.color)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (open) {
      setLabelName(label.name)
      setLabelColor(label.color)
    }
  }, [open, label])

  const { mutate: updateLabel, isPending } = usePutLabelsByIdWithJson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetLabelsByProjectIdQueryKey(label.projectId),
        })
        onOpenChange(false)
      },
    },
  })

  function handleSubmit() {
    if (!labelName.trim()) return
    updateLabel({
      id: label.id,
      data: { name: labelName.trim(), color: labelColor }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Editar etiqueta</DialogTitle>
          <DialogDescription className="sr-only">
            Formulário para editar o nome e a cor da etiqueta
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-label-name">Nome</Label>
            <Input
              id="edit-label-name"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              placeholder="Ex: Marketing"
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setLabelColor(color)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    backgroundColor: color,
                    outline:
                      labelColor === color ? `2px solid ${color}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !labelName.trim()}>
            {isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
