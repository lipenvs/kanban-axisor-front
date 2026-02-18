import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GetTasks200TasksItem } from '@/lib/api/model'
import type { GetLabelsByProjectId200LabelsItem } from '@/lib/api/model'

interface TaskCardProps {
  task: GetTasks200TasksItem
  label?: GetLabelsByProjectId200LabelsItem
  onClick?: () => void
  onDelete?: () => void
}

function formatDate(dateStr: unknown) {
  if (!dateStr) return null
  const d = new Date(dateStr as string)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function TaskCard({ task, label, onClick, onDelete }: TaskCardProps) {
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
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-delete-btn]')) return
        onClick?.()
      }}
      className={`
        group relative bg-card border border-border/60 rounded-xl p-3.5
        cursor-grab active:cursor-grabbing
        hover:border-border hover:shadow-md hover:shadow-black/5
        transition-all duration-200
        ${isDragging ? 'opacity-50 shadow-xl shadow-black/10 scale-[1.02] z-50' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
          {task.title}
        </h4>
        {onDelete && (
          <Button
            data-delete-btn
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

      {task.description && (
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {(label || !!task.dueDate) && (
        <div className="flex items-center gap-2 mt-2.5">
          {!!task.dueDate && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {label && (
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 border-none font-medium"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
              }}
            >
              {label.name}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
