import { useRef, useState } from 'react'
import {
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import {
  getGetColumnsQueryKey,
  usePostColumnsReorderWithJson,
} from '@/lib/api/column'
import {
  getGetTasksQueryKey,
  usePostTasksReorderWithJson,
} from '@/lib/api/task'
import type { GetColumns200ColumnsItem as Column } from '@/lib/api/model'
import type { GetTasks200TasksItem } from '@/lib/api/model'

interface UseKanbanDndParams {
  projectId: string
  columns: Column[]
}

export function useKanbanDnd({ projectId, columns }: UseKanbanDndParams) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)

  const queryClient = useQueryClient()
  const tasksQueryKey = getGetTasksQueryKey({ projectId })
  const tasksSnapshotRef = useRef<any>(null)

  const { mutateAsync: reorderColumns } = usePostColumnsReorderWithJson()
  const { mutateAsync: reorderTasks } = usePostTasksReorderWithJson()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Column') {
      setActiveColumn(event.active.data.current.column)
      return
    }
    setActiveTaskId(event.active.id as string)
    tasksSnapshotRef.current = queryClient.getQueryData(tasksQueryKey)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.data.current?.type === 'Column') return

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    const currentData = queryClient.getQueryData(tasksQueryKey) as any
    const currentTasks = currentData?.data?.tasks as GetTasks200TasksItem[] | undefined
    if (!currentTasks) return

    const activeTask = currentTasks.find((t) => t.id === activeId)
    if (!activeTask) return

    const overColumn = columns.find((c) => c.id === overId)
    const overTask = currentTasks.find((t) => t.id === overId)
    const targetColumnId = overColumn ? overId : overTask?.columnId
    if (!targetColumnId) return

    // Só atua em movimentações cross-column; dentro da mesma coluna o useSortable cuida do visual
    if (activeTask.columnId === targetColumnId) return

    queryClient.setQueryData(tasksQueryKey, (old: any) => {
      if (!old?.data?.tasks) return old
      const newTasks = [...old.data.tasks] as GetTasks200TasksItem[]
      const activeIdx = newTasks.findIndex((t) => t.id === activeId)
      if (activeIdx === -1) return old

      const [moved] = newTasks.splice(activeIdx, 1)

      if (overColumn) {
        newTasks.push({ ...moved, columnId: targetColumnId })
      } else {
        const overIdx = newTasks.findIndex((t) => t.id === overId)
        if (overIdx === -1) {
          newTasks.push({ ...moved, columnId: targetColumnId })
        } else {
          newTasks.splice(overIdx, 0, { ...moved, columnId: targetColumnId })
        }
      }

      return { ...old, data: { ...old.data, tasks: newTasks } }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null)
    setActiveColumn(null)

    const { active, over } = event
    const snapshot = tasksSnapshotRef.current
    tasksSnapshotRef.current = null

    if (!over) {
      if (snapshot) queryClient.setQueryData(tasksQueryKey, snapshot)
      return
    }

    // --- Colunas ---
    if (active.data.current?.type === 'Column') {
      const activeColumnData = active.data.current?.column as Column
      const overColumnId = over.id as string
      if (activeColumnData.id === overColumnId) return

      const queryKey = getGetColumnsQueryKey({ projectId })
      const columnsSnapshot = queryClient.getQueryData(queryKey)

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
        .catch(() => queryClient.setQueryData(queryKey, columnsSnapshot))
      return
    }

    // --- Cards ---
    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    const currentData = queryClient.getQueryData(tasksQueryKey) as any
    const currentTasks = currentData?.data?.tasks as GetTasks200TasksItem[]
    const isOverColumn = columns.some((c) => c.id === overId)

    // Reorder dentro da mesma coluna (handleDragOver não tratou isso)
    if (!isOverColumn) {
      const activeTask = currentTasks.find((t) => t.id === activeId)
      const overTask = currentTasks.find((t) => t.id === overId)
      if (activeTask && overTask && activeTask.columnId === overTask.columnId) {
        queryClient.setQueryData(tasksQueryKey, (old: any) => {
          if (!old?.data?.tasks) return old
          const newTasks = [...old.data.tasks] as GetTasks200TasksItem[]
          const activeIdx = newTasks.findIndex((t) => t.id === activeId)
          const overIdx = newTasks.findIndex((t) => t.id === overId)
          if (activeIdx === -1 || overIdx === -1) return old
          const [moved] = newTasks.splice(activeIdx, 1)
          newTasks.splice(overIdx, 0, moved)
          return { ...old, data: { ...old.data, tasks: newTasks } }
        })
      }
    }

    // Determinar payload da API com base no estado original vs final
    const originalTasks = snapshot?.data?.tasks as GetTasks200TasksItem[] | undefined
    const originalActiveTask = originalTasks?.find((t) => t.id === activeId)
    const finalActiveTask = (queryClient.getQueryData(tasksQueryKey) as any)?.data?.tasks?.find(
      (t: GetTasks200TasksItem) => t.id === activeId,
    )

    const changedColumn =
      originalActiveTask && finalActiveTask && finalActiveTask.columnId !== originalActiveTask.columnId
        ? finalActiveTask.columnId
        : isOverColumn
          ? overId
          : undefined

    reorderTasks({
      data: {
        activeId,
        overId: isOverColumn ? undefined : overId,
        columnId: changedColumn,
      },
    })
      .then(() => queryClient.invalidateQueries({ queryKey: tasksQueryKey }))
      .catch(() => {
        if (snapshot) queryClient.setQueryData(tasksQueryKey, snapshot)
      })
  }

  function handleDragCancel() {
    setActiveTaskId(null)
    setActiveColumn(null)
    if (tasksSnapshotRef.current) {
      queryClient.setQueryData(tasksQueryKey, tasksSnapshotRef.current)
      tasksSnapshotRef.current = null
    }
  }

  return {
    activeTaskId,
    activeColumn,
    sensors,
    collisionDetection: closestCorners,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  }
}
