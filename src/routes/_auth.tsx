import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { auth } from '../lib/auth'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const { isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await auth.getSession()
      if (!response.data?.session) {
        throw redirect({ to: '/login' })
      }
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
          }`}
      >
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
