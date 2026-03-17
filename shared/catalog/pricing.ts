const PRICE_MATCHER = /(\$)\s*([0-9]+(?:\.[0-9]{1,2})?)/

const currencyMap: Record<string, string> = {
  '$': 'usd',
}

export type ParsedPrice = {
  amount: number
  currency: string
}

export const parsePriceLabel = (priceLabel: string): ParsedPrice | null => {
  const match = PRICE_MATCHER.exec(priceLabel)

  if (!match) {
    return null
  }

  const symbol = match[1] ?? '$'
  const rawAmount = match[2]

  if (!rawAmount) {
    return null
  }

  const numericAmount = Number.parseFloat(rawAmount)

  if (!Number.isFinite(numericAmount)) {
    return null
  }

  return {
    amount: Math.round(numericAmount * 100),
    currency: currencyMap[symbol] ?? 'usd',
  }
}

export const formatMinorAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
