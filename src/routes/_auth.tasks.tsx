import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { auth } from '../lib/auth'

export const Route = createFileRoute('/_auth/tasks')({
    component: TasksPage,
})

function TasksPage() {
    const navigate = useNavigate()

    const { data, isLoading } = useQuery({
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

    if (isLoading) {
        return <div>Carregando...</div>
    }

    return (
        <div>
            <h1>Meu nome é {data?.user?.name}</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}
