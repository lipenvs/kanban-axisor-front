import { createFileRoute } from '@tanstack/react-router'
import { Lock, Crown, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_auth/members')({
  component: MembersPage,
})

const WHATSAPP_NUMBER = '5547999008006'
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Olá! Tenho interesse no plano Pro do Axisor Kanban.',
)

function MembersPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
          <Lock className="w-10 h-10 text-muted-foreground/60" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
          <Crown className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Recurso exclusivo Pro
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          O gerenciamento de membros está disponível apenas no plano Pro.
          Faça upgrade para convidar membros, definir permissões e colaborar
          com sua equipe.
        </p>
      </div>

      <Button
        asChild
        size="lg"
        className="bg-green-600 hover:bg-green-700 text-white gap-2 mt-2"
      >
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="w-5 h-5" />
          Falar sobre o plano Pro
        </a>
      </Button>
    </div>
  )
}
