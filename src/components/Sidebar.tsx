import { LayoutDashboard, Pencil, Plus, Trash2, Users, MoreHorizontal } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Separator } from './ui/separator'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { useState } from 'react'
import { useNavigate, useParams, useMatchRoute } from '@tanstack/react-router'
import { useGetProjects } from '@/lib/api/project'
import { useGetLabelsByProjectId, useDeleteLabelsById, getGetLabelsByProjectIdQueryKey } from '@/lib/api/label'
import { CreateLabelDialog } from './kanban/dialogs/CreateLabelDialog'
import { EditLabelDialog } from './kanban/dialogs/EditLabelDialog'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { useQueryClient } from '@tanstack/react-query'
import { useSidebar } from './SidebarContext'

export default function Sidebar() {
  const [showAddLabel, setShowAddLabel] = useState(false)
  const [editingLabel, setEditingLabel] = useState<{ id: string; name: string; color: string; projectId: string } | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { projectId?: string }
  const selectedProjectId = params.projectId
  const { open, close } = useSidebar()
  const matchRoute = useMatchRoute()
  const isMembers = matchRoute({ to: '/members' })
  const isTasks = !isMembers

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [labelToDelete, setLabelToDelete] = useState<{ id: string; name: string } | null>(null)

  const [expandedActions, setExpandedActions] = useState<string | null>(null)

  const { data: projectsResponse } = useGetProjects()
  const projects = projectsResponse?.data?.projects ?? []

  const { data: labelsResponse } = useGetLabelsByProjectId(
    selectedProjectId ?? '',
    undefined,
    { query: { enabled: !!selectedProjectId } },
  )
  const labels = labelsResponse?.data?.labels ?? []

  const deleteLabelMutation = useDeleteLabelsById({
    mutation: {
      onSuccess: () => {
        if (selectedProjectId) {
          queryClient.invalidateQueries({
            queryKey: getGetLabelsByProjectIdQueryKey(selectedProjectId)
          })
          setShowDeleteDialog(false)
          setLabelToDelete(null)
        }
      }
    }
  })

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`
          fixed bg-card border-r border-border top-0 left-0 h-screen z-50 flex flex-col transition-transform duration-300 ease-in-out w-[260px]
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-40
        `}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <img
            src="/logo512.png"
            alt="Axisor Logo"
            className="w-8 h-8 shrink-0 object-contain"
          />
          <h1 className="text-foreground text-lg font-bold tracking-tight">
            Axisor Kanban
          </h1>
        </div>

        <div className="px-4 pb-6">
          <Select
            value={selectedProjectId ?? undefined}
            onValueChange={(val) => {
              navigate({ to: '/tasks/$projectId', params: { projectId: val } })
              close()
            }}
            disabled={!!isMembers}
          >
            <SelectTrigger className="w-full bg-muted/50 border-border/50 h-10">
              <SelectValue placeholder="Selecionar projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Projetos</SelectLabel>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <nav className="p-4 space-y-1">
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isTasks ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
            onClick={() => {
              if (selectedProjectId) {
                navigate({ to: '/tasks/$projectId', params: { projectId: selectedProjectId } })
              } else {
                navigate({ to: '/tasks' })
              }
              close()
            }}
          >
            <LayoutDashboard className="w-4 h-4" />
            Tarefas
          </button>
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isMembers ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
            onClick={() => {
              navigate({ to: '/members' })
              close()
            }}
          >
            <Users className="w-4 h-4" />
            Membros
          </button>
        </nav>

        <Separator />

        <div className="p-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Etiquetas
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setShowAddLabel(true)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-1">
              {labels.map((cat) => (
                <div key={cat.id} className="flex flex-col">
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent transition-colors group select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {cat.name}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background cursor-pointer"
                      onClick={() => setExpandedActions(expandedActions === cat.id ? null : cat.id)}
                    >
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>

                  {expandedActions === cat.id && (
                    <div className="px-3 pb-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 text-muted-foreground hover:text-foreground text-xs font-normal cursor-pointer"
                        onClick={() => {
                          setEditingLabel(cat)
                        }}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-normal cursor-pointer"
                        onClick={() => {
                          setLabelToDelete(cat)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {selectedProjectId && (
          <CreateLabelDialog
            open={showAddLabel}
            onOpenChange={setShowAddLabel}
            projectId={selectedProjectId}
          />
        )}

        {editingLabel && (
          <EditLabelDialog
            open={!!editingLabel}
            onOpenChange={(open) => !open && setEditingLabel(null)}
            label={editingLabel}
          />
        )}

        {labelToDelete && (
          <ConfirmDeleteDialog
            open={showDeleteDialog}
            onOpenChange={(open) => {
              setShowDeleteDialog(open)
              if (!open) setLabelToDelete(null)
            }}
            title="Excluir etiqueta"
            description={
              <p>
                Tem certeza que deseja excluir a etiqueta{' '}
                <span className="font-bold">{labelToDelete.name}</span>?
              </p>
            }
            onConfirm={() => deleteLabelMutation.mutate({ id: labelToDelete.id })}
            isPending={deleteLabelMutation.isPending}
          />
        )}
      </aside>
    </>
  )
}
