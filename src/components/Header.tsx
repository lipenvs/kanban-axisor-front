import { useNavigate, useRouterState, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { auth } from '../lib/auth'
import { Search, LogOut, Settings, Plus, Menu, X } from 'lucide-react'
import { NotificationPopover } from './NotificationPopover'
import { useState, useEffect, useMemo } from 'react'
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
import { SettingsDialog } from './kanban/dialogs/SettingsDialog'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from './ui/sheet'
import Sidebar from './Sidebar'

export default function Header() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddProject, setShowAddProject] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const { pathname, search: locationSearch } = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      search: s.location.search
    })
  })
  const isTasksPage = pathname.includes('/tasks') || pathname === '/'
  const params = useParams({ strict: false }) as { projectId?: string }

  const urlSearchQuery = useMemo(() => {
    const sp = new URLSearchParams(locationSearch)
    return sp.get('search') || ''
  }, [locationSearch])

  useEffect(() => {
    setSearchQuery(urlSearchQuery)
  }, [urlSearchQuery])

  useEffect(() => {
    setMobileSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    const projectId = params.projectId
    if (!isTasksPage || !projectId) return

    const timer = setTimeout(() => {
      if (searchQuery !== urlSearchQuery) {
        navigate({
          to: '/tasks/$projectId',
          params: { projectId },
          search: (prev) => ({
            ...prev,
            search: searchQuery.trim() || undefined,
          }),
          replace: true,
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, isTasksPage, params.projectId, urlSearchQuery, navigate])

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
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
      <div className="h-16 flex items-center justify-between px-3 sm:px-4 md:px-6 gap-2">

        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[260px] border-none">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <Sidebar className="border-none" />
            </SheetContent>
          </Sheet>

          {isTasksPage && (
            <div className="relative hidden sm:flex flex-1 max-w-xs lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Buscar tarefas..."
                className="pl-9 h-9 bg-muted/50 border-border/50 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {isTasksPage && (
            <Button
              size="icon"
              variant="ghost"
              className="sm:hidden shrink-0"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Buscar"
            >
              {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </Button>
          )}

          <Button size="sm" onClick={() => setShowAddProject(true)} className="hidden sm:inline-flex gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Novo projeto</span>
          </Button>
          <Button size="icon" variant="outline" onClick={() => setShowAddProject(true)} className="sm:hidden shrink-0">
            <Plus className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-border/60 hidden sm:block mx-1" />

          <NotificationPopover />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
                    {data?.user?.name?.charAt(0) ?? 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium truncate">
                  {data?.user?.name ?? 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {data?.user?.email ?? 'Email'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4 mr-2 shrink-0" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2 shrink-0" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isTasksPage && mobileSearchOpen && (
        <div className="sm:hidden px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar tarefas..."
              className="pl-9 h-9 bg-muted/50 border-border/50 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )}

      <CreateProjectDialog
        open={showAddProject}
        onOpenChange={setShowAddProject}
      />

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </header>
  )
}
