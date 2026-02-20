import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { auth } from '../lib/auth'
import { Bell, Search, LogOut, Settings, Plus, Menu } from 'lucide-react'
import { NotificationPopover } from './NotificationPopover'
import { useState } from 'react'
import { Input } from './ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import { CreateProjectDialog } from './kanban/dialogs/CreateProjectDialog'
import { useSidebar } from './SidebarContext'

export default function Header() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddProject, setShowAddProject] = useState(false)
  const { toggle } = useSidebar()

  const { data } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await auth.getSession()
      return response.data
    },
  })

  async function handleLogout() {
    await auth.signOut()
    navigate({ to: '/login' })
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 gap-3 shrink-0">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={toggle}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar tarefas..."
            className="pl-9 h-9 bg-muted/50 border-border/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button size="sm" onClick={() => setShowAddProject(true)} className="hidden sm:inline-flex">
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Novo projeto</span>
        </Button>
        <Button size="icon" variant="outline" onClick={() => setShowAddProject(true)} className="sm:hidden">
          <Plus className="w-4 h-4" />
        </Button>

        <div className="h-8 w-px bg-border/60 hidden md:block" />

        <div className="flex items-center gap-1 md:gap-2">
          <NotificationPopover />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
                    {data?.user?.name?.charAt(0) ?? 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">
                  {data?.user?.name ?? 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data?.user?.email ?? 'Email'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CreateProjectDialog
        open={showAddProject}
        onOpenChange={setShowAddProject}
      />
    </header>
  )
}
