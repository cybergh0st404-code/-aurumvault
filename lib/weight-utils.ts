/**
 * Gold and Specie Weight Conversion Utilities
 * 1 Troy Ounce (ozt) = 31.1034768 grams = 0.0311034768 kilograms
 */

export const GRAMS_PER_OZT = 31.1034768

/**
 * Parse any weight string or number into Troy Ounces (ozt)
 * Handles: "93.9 g", "93.9g", "0.094 kg", "3.019 ozt", "400 oz", "93.9"
 */
export function parseWeightToOzt(weight: string | number | undefined | null): number {
  if (weight === undefined || weight === null) return 0
  if (typeof weight === 'number') {
    if (isNaN(weight) || weight <= 0) return 0
    // If it's a raw number: if >= 50, assume grams unless specified; if < 50, can be ozt
    return weight >= 50 ? weight / GRAMS_PER_OZT : weight
  }

  const str = String(weight).trim().toLowerCase()
  if (!str) return 0

  // Check for kilogram: e.g. "0.0939 kg", "12.5kg"
  const kgMatch = str.match(/([0-9.]+)\s*kg/)
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1])
    if (!isNaN(kg)) return (kg * 1000) / GRAMS_PER_OZT
  }

  // Check for troy ounce or ounce: e.g. "3.019 ozt", "400 oz", "3.019ozt"
  const ozMatch = str.match(/([0-9.]+)\s*(?:ozt|oz)/)
  if (ozMatch) {
    const oz = parseFloat(ozMatch[1])
    if (!isNaN(oz)) return oz
  }

  // Check for gram: e.g. "93.9 g", "93.9g", "93.9 grams"
  const gMatch = str.match(/([0-9.]+)\s*g(?:rams?)?/)
  if (gMatch) {
    const g = parseFloat(gMatch[1])
    if (!isNaN(g)) return g / GRAMS_PER_OZT
  }

  // Fallback: extract the first numeric value
  const numMatch = str.match(/([0-9.]+)/)
  if (numMatch) {
    const val = parseFloat(numMatch[1])
    if (!isNaN(val)) {
      // If the original string had "g" anywhere or value >= 50, treat as grams
      if (str.includes('g') || val >= 50) {
        return val / GRAMS_PER_OZT
      }
      return val
    }
  }

  return 0
}

/**
 * Convert Troy Ounces to Kilograms
 */
export function oztToKg(ozt: number): number {
  return (ozt * GRAMS_PER_OZT) / 1000
}

/**
 * Convert Troy Ounces to Grams
 */
export function oztToGrams(ozt: number): number {
  return ozt * GRAMS_PER_OZT
}

/**
 * Format weight into standard depository display strings
 */
export function formatGoldWeight(ozt: number): {
  oztStr: string
  kgStr: string
  gramsStr: string
  summary: string
} {
  const safeOzt = isNaN(ozt) || ozt < 0 ? 0 : ozt
  const kg = oztToKg(safeOzt)
  const grams = oztToGrams(safeOzt)

  const oztStr = safeOzt.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ozt'

  const kgStr = kg >= 1
    ? kg.toFixed(3) + ' kg'
    : kg.toFixed(4) + ' kg'

  const gramsStr = grams.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + ' g'

  const summary = `${oztStr} (${kgStr} • ${gramsStr})`

  return { oztStr, kgStr, gramsStr, summary }
}

/**
 * Format any numeric or raw currency string into standard Swiss Lloyd's Specie valuation:
 * e.g. 16355 -> "$16,355.00 USD"
 * "$16,355" -> "$16,355.00 USD"
 */
export function formatDeclaredValue(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '$16,355.00 USD'
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return '$16,355.00 USD'
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
  }
  const cleanStr = String(val).trim()
  const num = parseFloat(cleanStr.replace(/[^0-9.]/g, ''))
  if (isNaN(num) || num <= 0) return '$16,355.00 USD'
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
}

/**
 * Parse any currency string into numeric USD:
 * e.g. "$16,355.00 USD" -> 16355
 */
export function parseDeclaredValue(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 16355
  if (typeof val === 'number') return isNaN(val) || val <= 0 ? 16355 : val
  const cleanStr = String(val).trim()
  const num = parseFloat(cleanStr.replace(/[^0-9.]/g, ''))
  return isNaN(num) || num <= 0 ? 16355 : num
}

