import { useState, useRef, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Upload, X, FileText, Paperclip, Check, ChevronsUpDown, ShieldCheck, ShieldAlert, Loader2, Download, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { GetTasks200TasksItem } from '@/lib/api/model'
import type { GetLabelsByProjectId200LabelsItem } from '@/lib/api/model'
import {
  useGetAttachmentsByTaskId,
  getGetAttachmentsByTaskIdQueryKey,
  useDeleteAttachmentsById,
  getGetAttachmentsDownloadByIdUrl,
} from '@/lib/api/attachment'
import type { GetAttachmentsByTaskId200 } from '@/lib/api/model/getAttachmentsByTaskId200'
import type { GetAttachmentsByTaskId200AttachmentsItem } from '@/lib/api/model/getAttachmentsByTaskId200AttachmentsItem'
import { useQueryClient } from '@tanstack/react-query'

interface LocalAttachment {
  id: string
  name: string
  size: number
  file: File
}

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
    assigneeId?: string | null
    files?: File[]
  }) => void
  isPending?: boolean
}

const taskFormSchema = z.object({
  title: z.string().min(1, 'Titulo é obrigatório'),
  description: z.string(),
  dueDate: z.string(),
  labelId: z.string(),
  assigneeId: z.string(),
  attachments: z.array(z.custom<LocalAttachment>()),
})

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function TaskDialog({
  open,
  onOpenChange,
  task,
  labels,
  onSubmit,
  isPending,
}: TaskDialogProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [uploadingAttachments, setUploadingAttachments] = useState<Map<string, { fileName: string; status: 'scanning' | 'saving' }>>(new Map())

  const isEditing = !!task
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: existingAttachmentsData } = useGetAttachmentsByTaskId(
    task?.id ?? '',
    { query: { enabled: !!task?.id && open } },
  )
  const existingAttachments: GetAttachmentsByTaskId200AttachmentsItem[] =
    (existingAttachmentsData?.data as GetAttachmentsByTaskId200 | undefined)?.attachments ?? []

  const { mutateAsync: deleteAttachment } = useDeleteAttachmentsById()

  async function handleDeleteAttachment(attachmentId: string) {
    await deleteAttachment({ id: attachmentId })
    queryClient.invalidateQueries({ queryKey: getGetAttachmentsByTaskIdQueryKey(task?.id ?? '') })
  }

  const { data: sessionData } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await auth.getSession()
      return response.data
    },
  })
  const session = sessionData

  const form = useForm({
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      dueDate: task?.dueDate?.split('T')[0] ?? '',
      labelId: task?.labelId ?? '',
      assigneeId: task?.assigneeId ?? '',
      attachments: [] as LocalAttachment[],
    },
    validators: {
      onSubmit: taskFormSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit({
        title: value.title.trim(),
        description: value.description.trim() || undefined,
        dueDate: value.dueDate || null,
        labelId: value.labelId || null,
        assigneeId: value.assigneeId || null,
        files: value.attachments.length > 0 ? value.attachments.map((a) => a.file) : undefined,
      })
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: task?.title ?? '',
        description: task?.description ?? '',
        dueDate: task?.dueDate?.split('T')[0] ?? '',
        labelId: task?.labelId ?? '',
        assigneeId: task?.assigneeId ?? '',
        attachments: [],
      })
    }
  }, [open, task])

  function handleFileSelect(files: FileList | null) {
    if (!files) return
    const newAttachments = Array.from(files)
      .filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
      .map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        file: f,
      }))
    form.setFieldValue('attachments', (prev) => [...prev, ...newAttachments])
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
          <DialogDescription className="sr-only">
            {isEditing ? 'Formulário para editar uma tarefa existente' : 'Formulário para criar uma nova tarefa'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <form.Field name="title">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="task-title">Titulo</FieldLabel>
                  <Input
                    id="task-title"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Ex: Implementar login"
                    aria-invalid={isInvalid}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        form.handleSubmit()
                      }
                    }}
                  />
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="task-desc">Descricao</FieldLabel>
                <Textarea
                  id="task-desc"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Descreva a tarefa..."
                  className="resize-none"
                />
              </Field>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field name="dueDate">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="task-date">Data de Entrega</FieldLabel>
                  <Input
                    id="task-date"
                    type="date"
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="labelId">
              {(field) => (
                <Field>
                  <FieldLabel>Etiqueta</FieldLabel>
                  <Select value={field.state.value} onValueChange={(v) => field.handleChange(v === '__none__' ? '' : v)}>
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
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name="assigneeId">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>Responsável</FieldLabel>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between font-normal px-3"
                        aria-invalid={isInvalid}
                      >
                        {field.state.value && session?.user && field.state.value === session.user.id ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-semibold">
                                {session.user.name?.charAt(0) ?? 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{session.user.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Selecione um responsável</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Procurar responsável..." />
                        <CommandList>
                          <CommandEmpty>Nenhum responsável encontrado.</CommandEmpty>
                          <CommandGroup>
                            {session?.user && (
                              <CommandItem
                                key={session.user.id}
                                value={session.user.name ?? ''}
                                onSelect={() => {
                                  field.handleChange(session.user.id === field.state.value ? '' : session.user.id)
                                  setOpenCombobox(false)
                                }}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-semibold">
                                      {session.user.name?.charAt(0) ?? 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{session.user.name}</span>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    field.state.value === session.user.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              )
            }}
          </form.Field>

          <div className="space-y-2">
            <FieldLabel className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              Anexos (PDF)
            </FieldLabel>

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

            {uploadingAttachments.size > 0 && (
              <div className="space-y-2 mt-3">
                {Array.from(uploadingAttachments.entries()).map(([attachmentId, attachment]) => (
                  <div
                    key={attachmentId}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/40"
                  >
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {attachment.fileName}
                      </p>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {attachment.status === 'scanning' ? 'Escaneando arquivo...' : 'Gravando arquivo...'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {existingAttachments.length > 0 && (
              <div className="space-y-2 mt-3">
                {existingAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/40 group/att"
                  >
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {att.fileName}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {formatFileSize(att.fileSize)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {att.status === 'clean' ? (
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                      ) : att.status === 'infected' || att.status === 'error' ? (
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover/att:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        asChild
                      >
                        <a
                          href={getGetAttachmentsDownloadByIdUrl(att.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover/att:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteAttachment(att.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form.Field name="attachments">
              {(field) => field.state.value.length > 0 && (
                <div className="space-y-2 mt-3">
                  {field.state.value.map((attachment) => (
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
                        onClick={() => field.handleChange(field.state.value.filter((a) => a.id !== attachment.id))}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </form.Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => form.handleSubmit()} disabled={isPending}>
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
