import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, X, FileText, Paperclip } from 'lucide-react'
import type { GetTasks200TasksItem } from '@/lib/api/model'
import type { GetLabelsByProjectId200LabelsItem } from '@/lib/api/model'
import type { Attachment } from '@/types'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: GetTasks200TasksItem | null
  labels: GetLabelsByProjectId200LabelsItem[]
  onSubmit: (data: {
    title: string
    description?: string
    dueDate?: string | null
    labelId?: string | null
  }) => void
  isPending?: boolean
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDateForInput(dateStr: unknown) {
  if (!dateStr) return ''
  const d = new Date(dateStr as string)
  return d.toISOString().split('T')[0]
}

export default function TaskDialog({
  open,
  onOpenChange,
  task,
  labels,
  onSubmit,
  isPending,
}: TaskDialogProps) {
  const isEditing = !!task
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [labelId, setLabelId] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title)
        setDescription(task.description ?? '')
        setDueDate(formatDateForInput(task.dueDate))
        setLabelId(task.labelId ?? '')
      } else {
        setTitle('')
        setDescription('')
        setDueDate('')
        setLabelId('')
      }
      setAttachments([])
    }
  }, [open, task, labels])

  function handleSubmit() {
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || null,
      labelId: labelId || null,
    })
  }

  function handleFileSelect(files: FileList | null) {
    if (!files) return
    const newAttachments = Array.from(files)
      .filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
      .map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
      }))
    setAttachments((prev) => [...prev, ...newAttachments])
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="task-title">Titulo</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Implementar login"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Descricao</Label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a tarefa..."
              rows={3}
              className="border-input placeholder:text-muted-foreground dark:bg-input/30 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="task-date">Data de Entrega</Label>
              <Input
                id="task-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Etiqueta</Label>
              <Select value={labelId} onValueChange={(v) => setLabelId(v === '__none__' ? '' : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">Nenhuma</span>
                  </SelectItem>
                  {labels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: l.color }}
                      />
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              Anexos (PDF)
            </Label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center gap-2 py-6 px-4
                rounded-xl border-2 border-dashed cursor-pointer
                transition-all duration-200
                ${isDragOver
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                  : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40'
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-colors duration-200
                ${isDragOver ? 'bg-blue-500/20' : 'bg-muted/60'}
              `}>
                <Upload className={`w-5 h-5 transition-colors ${isDragOver ? 'text-blue-400' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isDragOver ? 'Solte o arquivo aqui' : 'Clique ou arraste um PDF'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Apenas arquivos PDF
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 mt-3">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/40 group/att"
                  >
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {attachment.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {formatFileSize(attachment.size)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover/att:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !title.trim()}>
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
