import { LayoutDashboard, Plus, Users } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Separator } from './ui/separator'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { useState } from 'react'
import { AddCategoryDialog } from './dialogs/AddCategoryDialog'
import { AddProjectDialog } from './dialogs/AddProjectDialog'
import { useGetProjects } from '@/lib/api/generated'

export default function Sidebar() {
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>('')

  const { data: projectsResponse } = useGetProjects()
  const projects = projectsResponse?.data ?? []

  return (
    <aside
      className={`fixed bg-card border-r border-border top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out w-[260px]`}
    >
      <div className="flex items-center gap-3 px-6 py-6">
        <img
          src="/logo512.png"
          alt="Axisor Logo"
          className="w-8 h-8 shrink-0 object-contain"
        />
        <h1 className="text-foreground text-lg font-bold tracking-tight">
          Axisor Kanban
        </h1>
      </div>

      <div className="px-4 pb-6">
        <Select
          value={selectedProject}
          onValueChange={(val) => {
            if (val === 'new_project') {
              setShowAddProject(true)
            } else {
              setSelectedProject(val)
            }
          }}
        >
          <SelectTrigger className="w-full bg-muted/50 border-border/50 h-10">
            <SelectValue placeholder="Selecionar projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Projetos</SelectLabel>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
              <Separator className="my-2" />
              <SelectItem value="new_project" className="text-primary font-medium focus:text-primary cursor-pointer">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Criar novo projeto
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <nav className="p-4 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-colors">
          <LayoutDashboard className="w-4 h-4" />
          Tarefas
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
          <Users className="w-4 h-4" />
          Usuários
        </button>
      </nav>

      <Separator />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categorias
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setShowAddCategory(true)}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {[
              { id: '1', name: 'Categoria 1', color: '#FF0000' },
              { id: '2', name: 'Categoria 2', color: '#00FF00' },
              { id: '3', name: 'Categoria 3', color: '#0000FF' },
            ].map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
              >
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <AddCategoryDialog
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
      />
      <AddProjectDialog
        open={showAddProject}
        onOpenChange={setShowAddProject}
      />
    </aside>
  )
}
