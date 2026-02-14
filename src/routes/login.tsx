import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Eye, EyeOff } from 'lucide-react'
import { GoogleIcon } from '@/components/icons/google'
import { LinkedInIcon } from '@/components/icons/linkedin'

const loginSchema = z.object({
  email: z.email('Digite um endereço de e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      // TODO: integrar com Better-Auth
      console.log('Login:', value)
    },
    validators: {
      onSubmit: loginSchema,
    },
  })

  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:w-2/3 lg:items-center lg:justify-center" />
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/3">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Entrar
            </h1>
            <p className="text-sm text-zinc-500">
              Bem-vindo de volta! Digite suas credenciais para continuar.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
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
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
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
                    {isSubmitting ? 'Entrando...' : 'Entrar'}
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
            Não tem uma conta?{' '}
            <Link
              to="/login"
              className="font-semibold text-zinc-900 transition-colors hover:text-zinc-700"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
