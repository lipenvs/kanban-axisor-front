import { useMemo, useState } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
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
  usePutColumnsByIdWithJson,
  useDeleteColumnsById,
} from '@/lib/api/column'
import {
  useGetTasks,
  getGetTasksQueryKey,
  usePostTasksWithJson,
  usePutTasksByIdWithJson,
  useDeleteTasksById,
} from '@/lib/api/task'
import {
  useGetLabelsByProjectId,
} from '@/lib/api/label'
import {
  useGetAttachmentsByTasks,
  getGetAttachmentsByTasksQueryKey,
  postAttachmentsUploadByTaskIdWithFormData,
} from '@/lib/api/attachment'
import { useQueryClient } from '@tanstack/react-query'
import type { GetColumns200ColumnsItem as Column } from '@/lib/api/model'
import type { GetTasks200TasksItem } from '@/lib/api/model'
import { useKanbanDnd } from './useKanbanDnd'

export function KanbanBoard({ projectId }: { projectId: string }) {
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
  const taskIds = useMemo(() => tasks.map((t) => t.id).join(','), [tasks])

  const { data: attachmentsResponse } = useGetAttachmentsByTasks(
    { taskIds },
    {
      query: {
        enabled: tasks.length > 0,
        refetchInterval: (query) => {
          const data = query.state.data as any
          const atts = data?.data?.attachments
          if (!atts || atts.length === 0) return false
          const hasPending = atts.some((a: any) => a.status === 'pending' || a.status === 'scanning')
          return hasPending ? 2000 : false
        },
      },
    },
  )

  const attachmentsByTask = useMemo(() => {
    const atts = (attachmentsResponse?.data as any)?.attachments ?? []
    const map: Record<string, any[]> = {}
    for (const a of atts) {
      if (!map[a.taskId]) map[a.taskId] = []
      map[a.taskId].push(a)
    }
    return map
  }, [attachmentsResponse])

  const {
    activeTaskId,
    activeColumn,
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useKanbanDnd({ projectId, columns })

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

  const { mutateAsync: createTask, isPending: isCreatingTask } = usePostTasksWithJson()

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

  async function uploadFiles(taskId: string, files: File[]) {
    await Promise.all(
      files.map((file) =>
        postAttachmentsUploadByTaskIdWithFormData(taskId, { file })
      )
    )
    queryClient.invalidateQueries({ queryKey: getGetAttachmentsByTasksQueryKey() })
  }

  async function handleTaskSubmit(data: {
    title: string
    description?: string
    dueDate?: string | null
    labelId?: string | null
    assigneeId?: string | null
    files?: File[]
  }) {
    const labelId = data.labelId ?? undefined

    if (editingTask) {
      updateTask({
        id: editingTask.id,
        data: {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          labelId,
        },
      })
      if (data.files?.length) {
        uploadFiles(editingTask.id, data.files)
      }
    } else if (defaultColumnId) {
      const result = await createTask({
        data: {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          labelId: labelId!,
          columnId: defaultColumnId,
        },
      })
      const taskId = result.data?.id
      if (taskId && data.files?.length) {
        await uploadFiles(taskId, data.files)
      }
      queryClient.invalidateQueries({ queryKey: tasksQueryKey })
      setTaskDialogOpen(false)
      setEditingTask(null)
      setDefaultColumnId(null)
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

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <ScrollArea className="flex-1">
          <div className="flex gap-5 pb-4 h-full">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasks.filter((t) => t.columnId === column.id)}
                labels={labels}
                attachmentsByTask={attachmentsByTask}
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
