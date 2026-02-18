import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import KanbanColumn from '@/components/kanban/KanbanColumn'
import { Plus } from 'lucide-react'
import ColumnDialog from './ColumnDialog'
import {
  useGetColumns,
  getGetColumnsQueryKey,
  usePostColumnsWithJson,
  usePostColumnsReorderWithJson,
  usePutColumnsByIdWithJson,
  useDeleteColumnsById,
} from '@/lib/api/column'
import { useQueryClient } from '@tanstack/react-query'
import type { Task, Category, User } from '@/types'
import type { GetColumns200ColumnsItem as Column } from '@/lib/api/model'

export function KanbanBoard({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient()
  const { data: columnsResponse } = useGetColumns({ projectId })

  const columns = useMemo(() => {
    return columnsResponse?.data.columns ?? []
  }, [columnsResponse])

  const { mutate: createColumn } = usePostColumnsWithJson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetColumnsQueryKey({ projectId }) })
        setColumnDialogOpen(false)
        setEditingColumn(null)
      }
    }
  })

  const { mutate: updateColumn } = usePutColumnsByIdWithJson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetColumnsQueryKey({ projectId }) })
        setColumnDialogOpen(false)
        setEditingColumn(null)
      }
    }
  })

  const { mutate: deleteColumn } = useDeleteColumnsById({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetColumnsQueryKey({ projectId }) })
      }
    }
  })

  const { mutateAsync: reorderColumns } = usePostColumnsReorderWithJson()

  // UI State
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)

  // TODO: Integrate Task/Category/User API
  const tasks: Task[] = []
  const categories: Category[] = []
  const users: User[] = []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleColumnSubmit(title: string) {
    if (editingColumn) {
      updateColumn({ id: editingColumn.id, data: { title } })
    } else {
      createColumn({ data: { title, projectId } })
    }
  }

  function handleCreateTask(columnId: string) {
    // TODO: Create task API
    console.log('Create task', columnId)
  }

  function handleEditTask(task: Task) {
    // TODO: abrir modal de edição
    console.log('Edit task', task)
  }

  function handleDeleteTask(id: string) {
    // TODO: Delete task API
    console.log('Delete task', id)
  }

  function handleEditColumn(column: Column) {
    setEditingColumn(column)
    setColumnDialogOpen(true)
  }

  function handleAddColumn() {
    setEditingColumn(null)
    setColumnDialogOpen(true)
  }

  function handleDeleteColumn(id: string) {
    deleteColumn({ id })
    // setTasks((prev) => prev.filter((t) => t.columnId !== id)) // Logic for tasks needs to be handled by backend cascade delete or frontend optimistic update, leaving for now as backend handles cascade delete for columns? Schema says cascade delete on project, but maybe not on tasks? Assuming tasks are deleted by backend.
  }

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Column') {
      setActiveColumn(event.active.data.current.column)
      return
    }
    setActiveTaskId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null)
    setActiveColumn(null)

    const { active, over } = event
    if (!over) return

    const isActiveColumn = active.data.current?.type === 'Column'
    if (isActiveColumn) {
      const activeColumnData = active.data.current?.column as Column
      // over pode ser um droppable de coluna (id = column.id)
      const overColumnId = over.id as string
      if (activeColumnData.id === overColumnId) return

      const queryKey = getGetColumnsQueryKey({ projectId })

      // Snapshot antes do update otimista para reverter em caso de erro
      const snapshot = queryClient.getQueryData(queryKey)

      // Update otimista: move no cache
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.data?.columns) return old
        const newColumns = [...old.data.columns] as Column[]
        const activeIdx = newColumns.findIndex((c) => c.id === activeColumnData.id)
        const overIdx = newColumns.findIndex((c) => c.id === overColumnId)
        if (activeIdx === -1 || overIdx === -1) return old
        const [moved] = newColumns.splice(activeIdx, 1)
        newColumns.splice(overIdx, 0, moved)
        const reordered = newColumns.map((c, i) => ({ ...c, order: i }))
        return { ...old, data: { ...old.data, columns: reordered } }
      })

      reorderColumns({ data: { activeId: activeColumnData.id, overId: overColumnId } })
        .then(() => {
          queryClient.invalidateQueries({ queryKey })
        })
        .catch(() => {
          // Reverte para o estado anterior em caso de erro
          queryClient.setQueryData(queryKey, snapshot)
        })
      return
    }

    const activeId = active.id
    const overId = over.id
    if (activeId === overId) return

    const isColumn = columns.some((c) => c.id === overId)
    if (isColumn) {
      // TODO: Move task to column API
      return
    }

    const overTask = tasks.find((t) => t.id === overId)
    if (overTask) {
      // TODO: Reorder task API
    }
  }

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="flex-1">
          <div className="flex gap-5 pb-4 h-full">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={tasks.filter((t) => t.columnId === column.id)}
                  categories={categories}
                  users={users}
                  onCreateTask={handleCreateTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onEditColumn={handleEditColumn}
                  onDeleteColumn={handleDeleteColumn}
                />
              ))}
            <button
              onClick={handleAddColumn}
              className="w-72 shrink-0 h-fit flex items-center justify-center gap-2 py-10
              rounded-xl border-2 border-dashed border-border/40 hover:border-border
              text-muted-foreground hover:text-foreground
              bg-muted/10 hover:bg-muted/30
              transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Nova coluna</span>
            </button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {activeColumn ? (
            <KanbanColumn
              column={activeColumn}
              tasks={tasks.filter((t) => t.columnId === activeColumn.id)}
              categories={categories}
              users={users}
              onDeleteColumn={handleDeleteColumn}
              onCreateTask={handleCreateTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onEditColumn={handleEditColumn}
            />
          ) : null}
          {activeTask ? (
            <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xl shadow-black/20 rotate-2 opacity-90 w-72 cursor-grabbing">
              <h4 className="text-sm font-medium text-foreground">
                {activeTask.title}
              </h4>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ColumnDialog
        open={columnDialogOpen}
        onOpenChange={setColumnDialogOpen}
        column={editingColumn}
        onSubmit={handleColumnSubmit}
      />
    </>
  )
}
