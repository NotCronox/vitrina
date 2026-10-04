import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/format'

export type ButtonVariant = 'primary' | 'ink' | 'outline' | 'ghost' | 'whatsapp'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-110',
  ink: 'bg-ink text-bg hover:opacity-90',
  outline: 'border border-current/25 text-ink hover:border-current/60 hover:bg-ink/5',
  ghost: 'text-ink hover:bg-ink/8',
  whatsapp: 'bg-[#1fa855] text-white hover:bg-[#1b9a4d]',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs gap-1.5',
  md: 'h-11 px-6 text-sm gap-2',
  lg: 'h-14 px-8 text-[0.95rem] gap-2.5',
}

/** Clases de boton reutilizables en <button>, <Link> y <a>. */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center rounded-btn font-semibold tracking-wide whitespace-nowrap',
    'transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
    variants[variant],
    sizes[size],
    className,
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />
}
