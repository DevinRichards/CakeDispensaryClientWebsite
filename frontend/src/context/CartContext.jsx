import { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'cake_cart_items'

// ─── NM Purchase Limits (per transaction) ─────────────────────────────────────
export const PURCHASE_LIMITS = {
  // Flower + pre-rolls (marijuana flower)
  flowerGrams:      { limit: 56,  label: 'Flower',      unit: 'g'  },
  // Concentrates
  concentrateGrams: { limit: 16,  label: 'Concentrate', unit: 'g'  },
  // Infused edibles (THC mg)
  edibleThcMg:      { limit: 800, label: 'Edibles',     unit: 'mg THC' },
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD': {
      // Cart item ID includes variant to allow same product in different sizes
      const exists = state.items.find((i) => i.id === action.payload.id)
      if (exists) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i
          ),
        }
      }
      return { ...state, items: [...state.items, { ...action.payload, qty: 1 }] }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) }
    case 'SET_QTY': {
      if (action.payload.qty <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i
        ),
      }
    }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'HYDRATE':
      return { ...state, items: action.payload }
    case 'TOGGLE_OPEN':
      return { ...state, isOpen: !state.isOpen }
    case 'OPEN':
      return { ...state, isOpen: true }
    case 'CLOSE':
      return { ...state, isOpen: false }
    default:
      return state
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false })

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const items = JSON.parse(saved)
        if (Array.isArray(items) && items.length > 0) {
          dispatch({ type: 'HYDRATE', payload: items })
        }
      }
    } catch {
      // ignore malformed data
    }
  }, [])

  // Persist items to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // ignore storage errors
    }
  }, [state.items])

  // ── Purchase limit totals ──────────────────────────────────────────────────

  const purchaseTotals = useMemo(() => {
    let flowerGrams      = 0
    let concentrateGrams = 0
    let edibleThcMg      = 0

    for (const item of state.items) {
      const qty = item.qty || 1
      if (item.category === 'flower' || item.category === 'prerolls') {
        flowerGrams += (item.gramsPerUnit || 0) * qty
      }
      if (item.category === 'concentrates') {
        concentrateGrams += (item.gramsPerUnit || 0) * qty
      }
      if (item.category === 'edibles' || item.category === 'drinks') {
        edibleThcMg += (item.thcMg || 0) * qty
      }
    }

    return {
      flowerGrams:      Math.round(flowerGrams * 100) / 100,
      concentrateGrams: Math.round(concentrateGrams * 100) / 100,
      edibleThcMg:      Math.round(edibleThcMg),
    }
  }, [state.items])

  /**
   * Check whether adding an item would exceed any NM purchase limit.
   * Returns { exceeded: false } or { exceeded: true, limitName, current, limit, unit }
   */
  const checkLimit = useCallback((item) => {
    const qty = 1
    if ((item.category === 'flower' || item.category === 'prerolls') && item.gramsPerUnit) {
      const newTotal = purchaseTotals.flowerGrams + item.gramsPerUnit * qty
      if (newTotal > PURCHASE_LIMITS.flowerGrams.limit) {
        return {
          exceeded:  true,
          limitName: 'Flower',
          current:   purchaseTotals.flowerGrams,
          adding:    item.gramsPerUnit,
          limit:     PURCHASE_LIMITS.flowerGrams.limit,
          unit:      'g',
        }
      }
    }
    if (item.category === 'concentrates' && item.gramsPerUnit) {
      const newTotal = purchaseTotals.concentrateGrams + item.gramsPerUnit * qty
      if (newTotal > PURCHASE_LIMITS.concentrateGrams.limit) {
        return {
          exceeded:  true,
          limitName: 'Concentrate',
          current:   purchaseTotals.concentrateGrams,
          adding:    item.gramsPerUnit,
          limit:     PURCHASE_LIMITS.concentrateGrams.limit,
          unit:      'g',
        }
      }
    }
    if (item.category === 'edibles' && item.thcMg) {
      const newTotal = purchaseTotals.edibleThcMg + item.thcMg * qty
      if (newTotal > PURCHASE_LIMITS.edibleThcMg.limit) {
        return {
          exceeded:  true,
          limitName: 'Edible THC',
          current:   purchaseTotals.edibleThcMg,
          adding:    item.thcMg,
          limit:     PURCHASE_LIMITS.edibleThcMg.limit,
          unit:      'mg THC',
        }
      }
    }
    return { exceeded: false }
  }, [purchaseTotals])

  // ── Actions ───────────────────────────────────────────────────────────────

  const addItem = useCallback((product) => {
    dispatch({ type: 'ADD', payload: product })
    dispatch({ type: 'OPEN' })
  }, [])

  const removeItem = useCallback((id) => dispatch({ type: 'REMOVE', payload: id }), [])
  const setQty     = useCallback((id, qty) => dispatch({ type: 'SET_QTY', payload: { id, qty } }), [])
  const clearCart  = useCallback(() => dispatch({ type: 'CLEAR' }), [])
  const toggleCart = useCallback(() => dispatch({ type: 'TOGGLE_OPEN' }), [])
  const openCart   = useCallback(() => dispatch({ type: 'OPEN' }), [])
  const closeCart  = useCallback(() => dispatch({ type: 'CLOSE' }), [])

  const total = state.items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const count = state.items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider
      value={{
        ...state,
        total,
        count,
        purchaseTotals,
        checkLimit,
        addItem,
        removeItem,
        setQty,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
