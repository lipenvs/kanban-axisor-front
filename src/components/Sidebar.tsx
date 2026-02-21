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
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useGetProjects } from '@/lib/api/project'
import { useGetLabelsByProjectId, useDeleteLabelsById, getGetLabelsByProjectIdQueryKey } from '@/lib/api/label'
import { getGetColumnsWithTasksQueryKey } from '@/lib/api/column'
import { CreateLabelDialog } from './kanban/dialogs/CreateLabelDialog'
import { EditLabelDialog } from './kanban/dialogs/EditLabelDialog'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const [showAddLabel, setShowAddLabel] = useState(false)
  const [editingLabel, setEditingLabel] = useState<{ id: string; name: string; color: string; projectId: string } | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { projectId?: string }
  const selectedProjectId = params.projectId
  const { pathname, search: locationSearch } = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      search: s.location.search
    })
  })

  const isMembers = pathname.includes('/members')
  const isTasks = pathname.includes('/tasks') || pathname === '/'

  const selectedLabelId = useMemo(() => {
    const sp = new URLSearchParams(locationSearch)
    return sp.get('labelId')
  }, [locationSearch])

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

  const { mutate: deleteLabel, isPending } = useDeleteLabelsById({
    mutation: {
      onSuccess: () => {
        if (selectedProjectId) {
          queryClient.invalidateQueries({
            queryKey: getGetLabelsByProjectIdQueryKey(selectedProjectId)
          })
          queryClient.invalidateQueries({
            queryKey: getGetColumnsWithTasksQueryKey({ projectId: selectedProjectId })
          })
          setShowDeleteDialog(false)
          setLabelToDelete(null)
          toast.success("Etiqueta excluída com sucesso.")
        }
      },
      onError: () => {
        toast.error("Não foi possível excluir a etiqueta. Tente novamente.")
      },
    }
  })

  return (
    <aside
      className={cn(
        "flex flex-col bg-card border-r border-border h-full w-[260px]",
        className
      )}
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
          }}
        >
          <LayoutDashboard className="w-4 h-4" />
          Tarefas
        </button>
        <button
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isMembers ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
          onClick={() => {
            navigate({ to: '/members' })
          }}
        >
          <Users className="w-4 h-4" />
          Membros
        </button>
      </nav>

      {!isMembers && <Separator />}

      {!isMembers && <div className="p-4 flex-1 flex flex-col min-h-0">
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
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors group select-none cursor-pointer ${selectedLabelId === cat.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent'
                    }`}
                  onClick={() => {
                    if (!selectedProjectId) return
                    setExpandedActions(null)
                    const nextLabelId =
                      selectedLabelId === cat.id ? undefined : cat.id
                    navigate({
                      to: '/tasks/$projectId',
                      params: { projectId: selectedProjectId },
                      search: (prev) => ({ ...prev, labelId: nextLabelId }),
                    })
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span
                      className={`text-sm transition-colors ${selectedLabelId === cat.id
                        ? 'text-accent-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                        }`}
                    >
                      {cat.name}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background cursor-default"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedActions(
                        expandedActions === cat.id ? null : cat.id,
                      )
                    }}
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
      </div>}

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
          onConfirm={() => deleteLabel({ id: labelToDelete.id })}
          isPending={isPending}
        />
      )}
    </aside>
  )
}
