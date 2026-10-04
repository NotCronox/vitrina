const moneyFormatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(value: number, currency = 'COP', locale = 'es-CO') {
  const key = `${locale}:${currency}`
  let formatter = moneyFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'COP' ? 0 : 2,
    })
    moneyFormatters.set(key, formatter)
  }
  return formatter.format(value)
}

export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10)
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/** Solo digitos, listo para wa.me. */
export function cleanPhone(phone: string) {
  return phone.replace(/\D/g, '')
}
