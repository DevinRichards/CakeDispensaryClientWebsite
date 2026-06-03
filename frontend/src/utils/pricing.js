export const formatCurrency = (value) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return '—'
  return `$${parsed.toFixed(2)}`
}

export const getMedicalPrice = (item) => item?.medicalPrice ?? item?.basePrice ?? item?.price ?? null

export const getRecreationalPrice = (item) => item?.recreationalPrice ?? item?.price ?? null

export const getPriceDisplay = (item) => {
  const medical = getMedicalPrice(item)
  const recreational = getRecreationalPrice(item)
  if (medical == null && recreational == null) return null
  if (medical === recreational) return formatCurrency(medical)
  return `Med ${formatCurrency(medical)} / Rec ${formatCurrency(recreational)}`
}

export const getLinePrices = (item) => {
  const qty = item?.qty || 1
  const medical = getMedicalPrice(item)
  const recreational = getRecreationalPrice(item)
  return {
    medical: medical == null ? null : medical * qty,
    recreational: recreational == null ? null : recreational * qty,
  }
}

export const getCartPriceTotals = (items = []) => {
  return items.reduce(
    (totals, item) => {
      const line = getLinePrices(item)
      return {
        medical: totals.medical + (line.medical || 0),
        recreational: totals.recreational + (line.recreational || 0),
      }
    },
    { medical: 0, recreational: 0 }
  )
}
