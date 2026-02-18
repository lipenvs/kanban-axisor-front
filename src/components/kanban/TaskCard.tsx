import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Task, Category, User } from '@/types'

interface TaskCardProps {
  task: Task
  category?: Category
  assignee?: User
  onClick?: () => void
  onDelete?: () => void
}

export default function TaskCard({ task, category, assignee, onClick, onDelete }: TaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`bg-card border border-border rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-opacity group ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground">{task.title}</h4>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {(category || assignee) && (
        <div className="flex items-center gap-2 mt-2">
          {category && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: category.color + '20', color: category.color }}
            >
              {category.name}
            </span>
          )}
          {assignee && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {assignee.name}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
