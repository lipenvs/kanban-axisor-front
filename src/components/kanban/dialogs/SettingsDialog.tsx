import { useState, useEffect } from 'react'
import { auth } from '@/lib/auth'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 100

import { useParams } from '@tanstack/react-router'
import { getGetColumnsWithTasksQueryKey } from '@/lib/api/column'

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const queryClient = useQueryClient()
  const [isUpdating, setIsUpdating] = useState(false)
  const [name, setName] = useState('')
  const params = useParams({ strict: false }) as { projectId?: string }

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await auth.getSession()
      return response.data
    },
  })

  useEffect(() => {
    if (open && session?.user) {
      setName(session.user.name ?? '')
    }
  }, [open, session])

  const originalName = session?.user?.name ?? ''
  const trimmedName = name.trim()
  const hasChanged = trimmedName !== originalName
  const isNameValid =
    trimmedName.length >= NAME_MIN_LENGTH && trimmedName.length <= NAME_MAX_LENGTH

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasChanged || !isNameValid) return

    setIsUpdating(true)
    try {
      const { error } = await auth.updateUser({
        name: trimmedName,
      })

      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['session'] })
      // Invalida também as queries de colunas com tarefas para atualizar iniciais nos cards
      if (params.projectId) {
        await queryClient.invalidateQueries({ queryKey: getGetColumnsWithTasksQueryKey({ projectId: params.projectId }) })
      }
      toast.success('Perfil atualizado com sucesso!')
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar perfil.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Gerencie suas informações de perfil.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                disabled={isUpdating}
                minLength={NAME_MIN_LENGTH}
                maxLength={NAME_MAX_LENGTH}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || !hasChanged || !isNameValid}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}