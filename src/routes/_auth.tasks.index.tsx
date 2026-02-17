import { AddProjectDialog } from '@/components/dialogs/AddProjectDialog'
import { useGetProjects } from '@/lib/api/generated'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { FolderPlus } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_auth/tasks/')({
  component: TasksIndexPage,
})

function TasksIndexPage() {
  const [showAddProject, setShowAddProject] = useState(false)
  const { data: projectsResponse, isLoading } = useGetProjects()
  const projects = projectsResponse?.data ?? []

  if (isLoading) return null

  if (projects.length > 0) {
    return (
      <Navigate
        to="/tasks/$projectId"
        params={{ projectId: projects[0].id }}
        replace
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <FolderPlus className="w-16 h-16 text-muted-foreground/50" />
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Nenhum projeto cadastrado
        </h2>
        <p className="text-muted-foreground">
          Crie um novo projeto para começar.
        </p>
      </div>
      <AddProjectDialog
        open={showAddProject}
        onOpenChange={setShowAddProject}
      />
    </div>
  )
}
