import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteProjectDialog } from '@/components/dialogs/DeleteProjectDialog'
import { useGetProjects } from '@/lib/api/generated'
import { createFileRoute } from '@tanstack/react-router'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_auth/tasks/$projectId')({
  component: TasksPage,
})

function TasksPage() {
  const { projectId } = Route.useParams()
  const { data: projectsResponse } = useGetProjects()
  const project = projectsResponse?.data?.find((p) => p.id === projectId)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const projectName = project?.name ?? ''

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
                autoFocus
              />
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditingName(false)}
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
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        projectName={projectName}
      />
    </div>
  )
}
