import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteProjectDialog } from '@/components/dialogs/DeleteProjectDialog'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { getGetProjectsQueryKey, useGetProjects, usePutProjectsByIdWithJson } from '@/lib/api/project'

export const Route = createFileRoute('/_auth/tasks/$projectId')({
  component: TasksPage,
})

function TasksPage() {
  const { projectId } = Route.useParams()
  const queryClient = useQueryClient()
  const { data: projectsResponse, isFetching } = useGetProjects()
  const projects = projectsResponse?.data
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                className="text-2xl font-bold h-10 w-72"
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
                className="h-8 w-8"
                onClick={handleUpdateName}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditingName(false)}
                disabled={isUpdating}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => {
                setNameValue(projectName)
                setEditingName(true)
              }}
            >
              <h1 className="text-2xl font-bold text-foreground">
                {projectName}
              </h1>
              <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir projeto
        </Button>
      </div>

      <DeleteProjectDialog
        projectId={projectId}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        projectName={projectName}
      />
    </div>
  )
}
