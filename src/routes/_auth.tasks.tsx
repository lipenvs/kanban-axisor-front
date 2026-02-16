import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/tasks')({
    component: TasksPage,
})

function TasksPage() {
    return (
        <div>
            <h1>Tasks</h1>
        </div>
    )
}
