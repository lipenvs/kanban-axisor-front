import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { ArrowLeft } from 'lucide-react'

const registerSchema = z.object({
  email: z.email('Digite um endereço de e-mail válido'),
})

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      console.log(value)
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
              Esqueci minha senha
            </h1>
            <p className="text-sm text-zinc-500">
              Digite seu e-mail e enviaremos um link para redefinir sua senha.
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

              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-lg bg-zinc-900 text-sm font-semibold text-white shadow-none transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Recuperar minha senha'}
                  </Button>
                )}
              </form.Subscribe>
            </FieldGroup>
          </form>

          <div className="text-center text-sm text-zinc-500">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 font-semibold text-zinc-900 transition-colors hover:text-zinc-700"
            >
              <ArrowLeft className="size-4" />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
