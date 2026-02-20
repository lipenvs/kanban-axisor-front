import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { getGetProjectsQueryKey, useGetProjects, usePutProjectsByIdWithJson, useDeleteProjectsById } from '@/lib/api/project'
import TaskBoard from '@/components/kanban/TaskBoard'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/tasks/$projectId')({
  validateSearch: z.object({
    labelId: z.string().optional(),
    search: z.string().optional(),
  }),
  component: TasksPage,
})

function TasksPage() {
  const { projectId } = Route.useParams()
  const { labelId, search } = Route.useSearch()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: projectsResponse, isFetching } = useGetProjects()
  const projects = projectsResponse?.data.projects
  const project = projects?.find((p) => p.id === projectId)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { mutate: updateProject, isPending: isUpdating } = usePutProjectsByIdWithJson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() })
        setEditingName(false)
      },
    },
  })

  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProjectsById({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() })
        setShowDeleteDialog(false)
        toast.success("Projeto excluído com sucesso.")
        navigate({ to: '/tasks' })
      },
      onError: () => {
        toast.error("Não foi possível excluir o projeto. Tente novamente.")
      },
    },
  })

  if (projects && !project && !isFetching) {
    return <Navigate to="/tasks" replace />
  }

  const projectName = project?.name ?? ''

  const handleUpdateName = () => {
    if (!nameValue.trim() || nameValue === projectName) {
      setEditingName(false)
      return
    }
    updateProject({ id: projectId, data: { name: nameValue } })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-3 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2 min-w-0">
              <Input
                className="text-xl md:text-2xl font-bold h-10 w-full max-w-72"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateName()
                  if (e.key === 'Escape') setEditingName(false)
                }}
                autoFocus
                disabled={isUpdating}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleUpdateName}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setEditingName(false)}
                disabled={isUpdating}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer min-w-0"
              onClick={() => {
                setNameValue(projectName)
                setEditingName(true)
              }}
            >
              <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                {projectName}
              </h1>
              <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive self-start sm:self-auto shrink-0"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir projeto
        </Button>
      </div>

      <TaskBoard projectId={projectId} labelId={labelId} searchQuery={search} />

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir projeto"
        description={<p>Tem certeza que deseja excluir o projeto <span className="font-bold">{projectName}</span>? Essa ação não pode ser desfeita e todas as tarefas serão removidas.</p>}
        onConfirm={() => deleteProject({ id: projectId })}
        isPending={isDeleting}
      />
    </div>
  )
}
