import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Loader2, LockKeyhole } from 'lucide-react'
import { useSnapshot } from '@/data'
import { auth } from '@/data/auth'
import { slugify } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { useSession } from '../core'
import { Field, TextInput } from '../ui'

export function LoginPage() {
  const { config } = useSnapshot()
  const signIn = useSession((s) => s.signIn)
  const isDemo = auth.mode === 'demo'
  const [email, setEmail] = useState(isDemo ? `admin@${slugify(config.business.name)}.demo` : '')
  const [password, setPassword] = useState(isDemo ? 'demo1234' : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return setError('Escribe tu correo y tu contraseña.')
    setBusy(true)
    setError('')
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-bg text-ink lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#1c1917] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: `radial-gradient(70% 60% at 30% 20%, ${config.theme.colors.accent}55, transparent 70%)` }}
          aria-hidden
        />
        <p className="relative flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
          <span className="grid size-6 place-items-center rounded-md bg-white text-[0.7rem] text-black">V</span>
          Vitrina
        </p>
        <div className="relative">
          <p className="text-4xl leading-tight font-semibold tracking-tight">Tu catálogo, a tu manera.</p>
          <p className="mt-4 max-w-md text-white/65">
            Productos, campos, diseño, secciones y pedidos: todo se administra desde aquí, sin tocar una línea de código.
          </p>
        </div>
        <p className="relative text-xs text-white/40">Vitrina · Rasec Dev</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-sm" noValidate>
          <Link to="/" className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Volver a la tienda
          </Link>
          <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-ink">
            <LockKeyhole className="size-5" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Panel de {config.business.name}</h1>
          <p className="mt-1 text-sm text-muted">Ingresa para administrar tu tienda.</p>

          <div className="mt-8 space-y-4">
            <Field label="Correo">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </Field>
            <Field label="Contraseña">
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-[10px] bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Entrar al panel
          </Button>

          {isDemo ? (
            <p className="mt-5 rounded-[10px] bg-accent/8 px-4 py-3 text-xs leading-relaxed text-ink/80">
              <strong>Modo demo:</strong> los datos de acceso ya están completos. Los cambios se guardan solo en este navegador.
            </p>
          ) : (
            <p className="mt-5 text-xs leading-relaxed text-muted">¿Olvidaste tu contraseña? Pídele a quien instaló la tienda que te envíe un enlace para cambiarla.</p>
          )}
        </motion.form>
      </div>
    </div>
  )
}
