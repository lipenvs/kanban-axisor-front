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
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import KanbanColumn from '@/components/kanban/KanbanColumn'
import { Plus } from 'lucide-react'
import ColumnDialog from './ColumnDialog'
import type { Column, Task, Category, User } from '@/types'

const INITIAL_COLUMNS: Column[] = [
  { id: 'todo', title: 'A Fazer', color: '#6366F1' },
  { id: 'doing', title: 'Em Progresso', color: '#F59E0B' },
  { id: 'done', title: 'Concluído', color: '#10B981' },
]

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Criar layout do dashboard', columnId: 'todo', order: 0 },
  { id: '2', title: 'Implementar autenticação', columnId: 'todo', order: 1 },
  { id: '3', title: 'Configurar deploy', columnId: 'doing', order: 0 },
  { id: '4', title: 'Escrever testes unitários', columnId: 'doing', order: 1 },
  { id: '5', title: 'Definir schema do banco', columnId: 'done', order: 0 },
]

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Frontend', color: '#6366f1' },
  { id: 'cat-2', name: 'Backend', color: '#f59e0b' },
  { id: 'cat-3', name: 'DevOps', color: '#22c55e' },
]

const INITIAL_USERS: User[] = [
  { id: 'user-1', name: 'Felipe' },
  { id: 'user-2', name: 'Ana' },
]

export function KanbanBoard() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS)
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns])

  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [categories] = useState(INITIAL_CATEGORIES)
  const [users] = useState(INITIAL_USERS)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleColumnSubmit(title: string, color: string) {
    if (editingColumn) {
      setColumns((prev) =>
        prev.map((c) => (c.id === editingColumn.id ? { ...c, title, color } : c))
      )
    } else {
      setColumns((prev) => [
        ...prev,
        { id: crypto.randomUUID(), title, color },
      ])
    }
  }

  function handleCreateTask(columnId: string) {
    const id = crypto.randomUUID()
    const columnTasks = tasks.filter((t) => t.columnId === columnId)
    setTasks((prev) => [
      ...prev,
      {
        id,
        title: 'Nova tarefa',
        columnId,
        order: columnTasks.length,
      },
    ])
  }

  function handleEditTask(task: Task) {
    // TODO: abrir modal de edição
    console.log('Edit task', task)
  }

  function handleDeleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
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
    setColumns((prev) => prev.filter((c) => c.id !== id))
    setTasks((prev) => prev.filter((t) => t.columnId !== id))
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

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveColumn = active.data.current?.type === 'Column'
    if (isActiveColumn) {
      setColumns((items) => {
        const activeIndex = items.findIndex((item) => item.id === activeId)
        const overIndex = items.findIndex((item) => item.id === overId)
        return arrayMove(items, activeIndex, overIndex)
      })
      return
    }

    const isColumn = columns.some((c) => c.id === overId)
    if (isColumn) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, columnId: overId as string } : t))
      )
      return
    }

    const overTask = tasks.find((t) => t.id === overId)
    if (overTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, columnId: overTask.columnId } : t
        )
      )
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
            <SortableContext
              items={columnsId}
              strategy={horizontalListSortingStrategy}
            >
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
            </SortableContext>
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
              onCreateTask={handleCreateTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onEditColumn={handleEditColumn}
              onDeleteColumn={handleDeleteColumn}
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
