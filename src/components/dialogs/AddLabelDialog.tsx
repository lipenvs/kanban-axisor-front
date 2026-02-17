import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { usePostLabelsWithJson, getGetLabelsByProjectIdQueryKey } from '@/lib/api/label'
import { useQueryClient } from '@tanstack/react-query'

const CATEGORY_COLORS = [
  '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F59E0B',
  '#EC4899', '#06B6D4', '#84CC16',
]

interface AddLabelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function AddLabelDialog({
  open,
  onOpenChange,
  projectId,
}: AddLabelDialogProps) {
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(CATEGORY_COLORS[0])
  const queryClient = useQueryClient()

  const { mutate: createLabel, isPending } = usePostLabelsWithJson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetLabelsByProjectIdQueryKey(projectId),
        })
        setNewLabelName('')
        setNewLabelColor(CATEGORY_COLORS[0])
        onOpenChange(false)
      },
    },
  })

  function handleSubmit() {
    if (!newLabelName.trim()) return
    createLabel({ data: { name: newLabelName.trim(), color: newLabelColor, projectId } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Nova etiqueta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="label-name">Nome</Label>
            <Input
              id="label-name"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Ex: Marketing"
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewLabelColor(color)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    backgroundColor: color,
                    outline:
                      newLabelColor === color ? `2px solid ${color}` : 'none',
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
          <Button onClick={handleSubmit} disabled={isPending || !newLabelName.trim()}>
            {isPending ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
