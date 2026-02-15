import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth } from '../lib/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { data } = await auth.getSession()

    if (data?.session) {
      throw redirect({ to: '/tasks' })
    }

    throw redirect({ to: '/login' })
  },
})
