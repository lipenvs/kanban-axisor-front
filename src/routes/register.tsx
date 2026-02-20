import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon, Eye, EyeOff } from 'lucide-react'
import { GoogleIcon } from '@/components/icons/google'
import { LinkedInIcon } from '@/components/icons/linkedin'
import { auth } from '@/lib/auth'

const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.email('Digite um endereço de e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null)
      await auth.signUp.email(
        {
          name: value.name,
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            toast.success('Conta criada com sucesso.')
            navigate({
              to: '/tasks',
            })
          },
          onError: (ctx) => {
            setErrorMessage(ctx.error.message || 'Erro ao criar conta')
          },
        },
      )
    },
    validators: {
      onSubmit: registerSchema,
    },
  })

  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:w-2/3 lg:items-center lg:justify-center" />
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/3">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Criar conta
            </h1>
            <p className="text-sm text-zinc-500">
              Preencha os dados abaixo para criar sua conta.
            </p>
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Erro ao criar conta</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              <form.Field
                name="name"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="text"
                        placeholder="Seu nome completo"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        className="h-11 rounded-lg border-zinc-300 bg-zinc-50 px-4 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-zinc-900/20"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>E-mail</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        placeholder="voce@exemplo.com"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        className="h-11 rounded-lg border-zinc-300 bg-zinc-50 px-4 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-zinc-900/20"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Senha</FieldLabel>
                      <div className="relative">
                        <Input
                          id={field.name}
                          name={field.name}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="h-11 rounded-lg border-zinc-300 bg-zinc-50 px-4 pr-11 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-zinc-900/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-700"
                          aria-label={
                            showPassword ? 'Ocultar senha' : 'Mostrar senha'
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="size-[18px]" />
                          ) : (
                            <Eye className="size-[18px]" />
                          )}
                        </button>
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-lg bg-zinc-900 text-sm font-semibold text-white shadow-none transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                )}
              </form.Subscribe>
            </FieldGroup>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1 bg-zinc-200" />
            <span className="text-xs font-medium tracking-wider text-zinc-400 uppercase">
              ou
            </span>
            <Separator className="flex-1 bg-zinc-200" />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-lg border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-none transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
            >
              <GoogleIcon className="mr-2 size-4" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-lg border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-none transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
            >
              <LinkedInIcon className="mr-2 size-4" />
              LinkedIn
            </Button>
          </div>

          <p className="text-center text-sm text-zinc-500">
            Já tem uma conta?{' '}
            <Link
              to="/login"
              className="font-semibold text-zinc-900 transition-colors hover:text-zinc-700"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
