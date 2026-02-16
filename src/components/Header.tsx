import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { auth } from '../lib/auth'
import { Bell, Search, LogOut, Settings, Plus } from 'lucide-react'
import { useState } from 'react'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import { AddProjectDialog } from './dialogs/AddProjectDialog'

export default function Header() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddProject, setShowAddProject] = useState(false)

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
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 gap-4 shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1 max-w-md pl-10 lg:pl-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none lg:left-3" />
          <Input
            type="search"
            placeholder="Buscar tarefas..."
            className="pl-9 h-9 bg-muted/50 border-border/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button size="sm" onClick={() => setShowAddProject(true)}>
          <Plus className="w-4 h-4" />
          Novo projeto
        </Button>

        <div className="h-8 w-px bg-border/60" />

        <div className="flex items-center gap-2">
          <button
            className="relative p-2.5 rounded-lg text-black/80 hover:text-black hover:bg-black/15 transition-all duration-200 cursor-pointer"
            aria-label="Notificações"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-400 rounded-full" />
          </button>

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
                <p className="text-sm font-medium">{data?.user?.name ?? 'Usuário'}</p>
                <p className="text-xs text-muted-foreground">{data?.user?.email ?? 'Email'}</p>
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

      <AddProjectDialog
        open={showAddProject}
        onOpenChange={setShowAddProject}
      />
    </header>
  )
}
