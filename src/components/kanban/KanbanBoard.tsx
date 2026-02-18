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
import TaskDialog from './TaskDialog'
import { ConfirmDeleteDialog } from '../dialogs/ConfirmDeleteDialog'
import {
  useGetColumns,
  getGetColumnsQueryKey,
  usePostColumnsWithJson,
  usePostColumnsReorderWithJson,
  usePutColumnsByIdWithJson,
  useDeleteColumnsById,
} from '@/lib/api/column'
import {
  useGetTasks,
  getGetTasksQueryKey,
  usePostTasksWithJson,
  usePutTasksByIdWithJson,
  useDeleteTasksById,
  usePostTasksReorderWithJson,
} from '@/lib/api/task'
import {
  useGetLabelsByProjectId,
} from '@/lib/api/label'
import { useQueryClient } from '@tanstack/react-query'
import type { GetColumns200ColumnsItem as Column } from '@/lib/api/model'
import type { GetTasks200TasksItem } from '@/lib/api/model'

export function KanbanBoard({ projectId }: { projectId: string }) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<GetTasks200TasksItem | null>(null)
  const [defaultColumnId, setDefaultColumnId] = useState<string | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data: columnsResponse } = useGetColumns({ projectId })
  const { data: tasksResponse } = useGetTasks({ projectId })
  const { data: labelsResponse } = useGetLabelsByProjectId(projectId)

  const columns = useMemo(() => columnsResponse?.data.columns ?? [], [columnsResponse])
  const tasks = useMemo(() => tasksResponse?.data.tasks ?? [], [tasksResponse])
  const labels = useMemo(() => labelsResponse?.data.labels ?? [], [labelsResponse])

  const tasksQueryKey = getGetTasksQueryKey({ projectId })

  const { mutate: createColumn } = usePostColumnsWithJson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetColumnsQueryKey({ projectId }) })
        setColumnDialogOpen(false)
        setEditingColumn(null)
      },
    },
  })

  const { mutate: updateColumn } = usePutColumnsByIdWithJson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetColumnsQueryKey({ projectId }) })
        setColumnDialogOpen(false)
        setEditingColumn(null)
      },
    },
  })

  const { mutate: deleteColumn } = useDeleteColumnsById({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetColumnsQueryKey({ projectId }) })
        queryClient.invalidateQueries({ queryKey: tasksQueryKey })
      },
    },
  })

  const { mutateAsync: reorderColumns } = usePostColumnsReorderWithJson()

  const { mutate: createTask, isPending: isCreatingTask } = usePostTasksWithJson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: tasksQueryKey })
        setTaskDialogOpen(false)
        setEditingTask(null)
        setDefaultColumnId(null)
      },
    },
  })

  const { mutate: updateTask, isPending: isUpdatingTask } = usePutTasksByIdWithJson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: tasksQueryKey })
        setTaskDialogOpen(false)
        setEditingTask(null)
      },
    },
  })

  const { mutate: deleteTask, isPending: isDeletingTask } = useDeleteTasksById({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: tasksQueryKey })
        setDeleteTaskId(null)
      },
    },
  })

  const { mutateAsync: reorderTasks } = usePostTasksReorderWithJson()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleColumnSubmit(title: string) {
    if (editingColumn) {
      updateColumn({ id: editingColumn.id, data: { title } })
    } else {
      createColumn({ data: { title, projectId } })
    }
  }

  function handleCreateTask(columnId: string) {
    setEditingTask(null)
    setDefaultColumnId(columnId)
    setTaskDialogOpen(true)
  }

  function handleEditTask(task: GetTasks200TasksItem) {
    setEditingTask(task)
    setDefaultColumnId(null)
    setTaskDialogOpen(true)
  }

  function handleTaskSubmit(data: {
    title: string
    description?: string
    dueDate?: string | null
    labelId?: string | null
    assigneeId?: string | null
  }) {
    const labelId = data.labelId ?? undefined
    const assigneeId = data.assigneeId ?? undefined

    if (editingTask) {
      updateTask({
        id: editingTask.id,
        data: {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          labelId,
          assigneeId,
        },
      })
    } else if (defaultColumnId) {
      createTask({
        data: {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          labelId: labelId!,
          columnId: defaultColumnId,
          assigneeId,
        },
      })
    }
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
      const overColumnId = over.id as string
      if (activeColumnData.id === overColumnId) return

      const queryKey = getGetColumnsQueryKey({ projectId })
      const snapshot = queryClient.getQueryData(queryKey)

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
        .then(() => queryClient.invalidateQueries({ queryKey }))
        .catch(() => queryClient.setQueryData(queryKey, snapshot))
      return
    }

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    const isOverColumn = columns.some((c) => c.id === overId)
    const snapshot = queryClient.getQueryData(tasksQueryKey)

    if (isOverColumn) {
      queryClient.setQueryData(tasksQueryKey, (old: any) => {
        if (!old?.data?.tasks) return old
        const newTasks = old.data.tasks.map((t: GetTasks200TasksItem) =>
          t.id === activeId ? { ...t, columnId: overId } : t,
        )
        return { ...old, data: { ...old.data, tasks: newTasks } }
      })

      reorderTasks({ data: { activeId, columnId: overId } })
        .then(() => queryClient.invalidateQueries({ queryKey: tasksQueryKey }))
        .catch(() => queryClient.setQueryData(tasksQueryKey, snapshot))
      return
    }

    const overTask = tasks.find((t) => t.id === overId)
    if (overTask) {
      const activeTask = tasks.find((t) => t.id === activeId)
      if (!activeTask) return

      queryClient.setQueryData(tasksQueryKey, (old: any) => {
        if (!old?.data?.tasks) return old
        const newTasks = [...old.data.tasks] as GetTasks200TasksItem[]
        const activeIdx = newTasks.findIndex((t) => t.id === activeId)
        const overIdx = newTasks.findIndex((t) => t.id === overId)
        if (activeIdx === -1 || overIdx === -1) return old
        const [moved] = newTasks.splice(activeIdx, 1)
        newTasks.splice(overIdx, 0, { ...moved, columnId: overTask.columnId })
        return { ...old, data: { ...old.data, tasks: newTasks } }
      })

      reorderTasks({
        data: {
          activeId,
          overId,
          columnId: overTask.columnId !== activeTask.columnId ? overTask.columnId : undefined,
        },
      })
        .then(() => queryClient.invalidateQueries({ queryKey: tasksQueryKey }))
        .catch(() => queryClient.setQueryData(tasksQueryKey, snapshot))
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
                labels={labels}
                onCreateTask={handleCreateTask}
                onEditTask={handleEditTask}
                onDeleteTask={(id) => setDeleteTaskId(id)}
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
              labels={labels}
              onDeleteColumn={handleDeleteColumn}
              onCreateTask={handleCreateTask}
              onEditTask={handleEditTask}
              onDeleteTask={(id) => setDeleteTaskId(id)}
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

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open)
          if (!open) {
            setEditingTask(null)
            setDefaultColumnId(null)
          }
        }}
        task={editingTask}
        labels={labels}
        onSubmit={handleTaskSubmit}
        isPending={isCreatingTask || isUpdatingTask}
      />

      <ConfirmDeleteDialog
        open={!!deleteTaskId}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
        title="Excluir tarefa"
        description="Tem certeza que deseja excluir esta tarefa? Esta acao nao pode ser desfeita."
        onConfirm={() => deleteTaskId && deleteTask({ id: deleteTaskId })}
        isPending={isDeletingTask}
      />
    </>
  )
}
