import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useQuery } from '@tanstack/react-query'
import { auth } from '@/lib/auth'
import type { GetTasks200TasksItem } from '@/lib/api/model'
import type { GetLabelsByProjectId200LabelsItem } from '@/lib/api/model'
import { Progress } from '../ui/progress'

interface TaskCardProps {
  task: GetTasks200TasksItem
  label?: GetLabelsByProjectId200LabelsItem
  attachments?: { id: string; status: string }[]
  onClick?: () => void
  onDelete?: () => void
}

function getAttachmentProgress(attachments?: { status: string }[]): number | null {
  if (!attachments || attachments.length === 0) return null
  const statusValue: Record<string, number> = { pending: 0, scanning: 50, clean: 100, infected: 100, error: 100 }
  const total = attachments.reduce((sum, a) => sum + (statusValue[a.status] ?? 0), 0)
  return Math.round(total / attachments.length)
}

function formatDate(dateStr: unknown) {
  if (!dateStr) return null
  const d = new Date(dateStr as string)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function TaskCard({ task, label, attachments, onClick, onDelete }: TaskCardProps) {
  const progress = getAttachmentProgress(attachments)
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const { data: sessionData } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await auth.getSession()
      return response.data
    },
  })
  const session = sessionData

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

      {progress !== null && <Progress className="mt-4" value={progress} />}

      {(label || !!task.dueDate || session?.user) && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {label && (
              <div
                className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border"
                style={{ borderColor: label.color, color: label.color }}
              >
                {label.name}
              </div>
            )}

            {!!task.dueDate && (
              <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {session?.user && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-semibold">
                {session.user.name?.charAt(0) ?? 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}
    </div>
  )
}
