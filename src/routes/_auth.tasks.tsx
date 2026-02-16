import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createFileRoute } from '@tanstack/react-router'
import { Check, Pencil, X } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_auth/tasks')({
    component: TasksPage,
})

function TasksPage() {
    const [editingName, setEditingName] = useState(false)
    const [nameValue, setNameValue] = useState("Projeto 1")

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                {editingName ? (
                    <div className="flex items-center gap-2">
                        <Input
                            className="text-2xl font-bold h-10 w-72"
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            autoFocus
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Check className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingName(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditingName(true)}>
                        <h1 className="text-2xl font-bold text-foreground">{nameValue}</h1>
                        <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>
        </div>
    )
}
