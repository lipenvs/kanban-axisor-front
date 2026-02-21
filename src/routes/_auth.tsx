import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { auth } from '../lib/auth'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const { isLoading, data } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await auth.getSession()
      if (!response.data?.session) {
        throw redirect({ to: '/login' })
      }
      return response.data
    },
  })

  const emailNotVerified = data?.user && data.user.emailVerified === false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background font-sans antialiased flex">
        <Sidebar className="hidden lg:flex fixed top-0 left-0 h-screen" />

        <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px] transition-all duration-300 ease-in-out min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {emailNotVerified && (
        <div className="fixed bottom-0 left-0 w-full z-[100] bg-neutral-800 text-white text-center py-2 font-semibold text-sm shadow-lg">
          Seu email ainda não foi verificado. Confirme seu email para manter sua conta ativa.
        </div>
      )}
    </>
  )
}
