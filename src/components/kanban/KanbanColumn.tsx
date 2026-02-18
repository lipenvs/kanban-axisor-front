import { useDraggable, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import TaskCard from './TaskCard'
import type { Task, Category, User } from '@/types'
import type { GetColumns200ColumnsItem as Column } from '@/lib/api/model'
import { Badge } from '../ui/badge'

interface KanbanColumnProps {
    column: Column
    tasks: Task[]
    categories: Category[]
    users: User[]
    onCreateTask?: (columnId: string) => void
    onEditTask?: (task: Task) => void
    onDeleteTask?: (id: string) => void
    onEditColumn: (column: Column) => void
    onDeleteColumn: (id: string) => void
}

export default function KanbanColumn({
    column,
    tasks,
    categories,
    users,
    onCreateTask,
    onEditTask,
    onDeleteTask,
    onEditColumn,
    onDeleteColumn,
}: KanbanColumnProps) {
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: column.id })
    const {
        attributes,
        listeners,
        setNodeRef: setDraggableRef,
        isDragging,
    } = useDraggable({
        id: `column-drag-${column.id}`,
        data: { type: 'Column', column },
    })

    const sortedTasks = [...tasks].sort((a, b) => a.order - b.order)
    const taskIds = sortedTasks.map((t) => t.id)

    return (
        <div
            className={`
                flex flex-col w-72 shrink-0 rounded-xl p-3 transition-colors duration-200 min-h-[200px]
                ${isOver ? 'bg-gray-200 shadow-inner' : 'bg-gray-100'}
                ${isDragging ? 'opacity-50' : ''}
            `}
        >
            <div
                ref={setDraggableRef}
                {...listeners}
                {...attributes}
                className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-1.5">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
                    <Badge
                        className="h-5 px-1.5 text-[10px] font-semibold bg-gray-200 text-gray-600"
                    >
                        {tasks.length}
                    </Badge>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditColumn(column)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDeleteColumn(column.id)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div
                ref={setDroppableRef}
                className="flex-1"
            >
                <ScrollArea className="h-full">
                    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2.5">
                            {sortedTasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    category={categories.find((c) => c.id === task.categoryId)}
                                    assignee={users.find((u) => u.id === task.assigneeId)}
                                    onClick={() => onEditTask?.(task)}
                                    onDelete={() => onDeleteTask?.(task.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                    {onCreateTask && (
                        <button
                            onClick={() => onCreateTask(column.id)}
                            className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-2.5 rounded-lg
                  text-muted-foreground hover:text-foreground hover:bg-accent/50
                  border border-dashed border-border/50 hover:border-border
                  transition-all duration-200 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Criar
                        </button>
                    )}
                </ScrollArea>
            </div>
        </div>
    )
}
