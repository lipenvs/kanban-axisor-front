import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { auth } from '../lib/auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { data } = await auth.getSession()

    if (!data?.session) {
      throw redirect({ to: '/login' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
