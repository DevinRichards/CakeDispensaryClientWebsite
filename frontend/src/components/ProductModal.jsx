import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { formatCurrency, getMedicalPrice, getPriceDisplay, getRecreationalPrice } from '../utils/pricing'

const TYPE_COLORS = {
  'Indica Dominant': 'bg-tertiary/20 text-tertiary',
  'Sativa Dominant': 'bg-secondary/20 text-secondary',
  'Balanced Hybrid':  'bg-primary/20 text-primary',
  Gummies:            'bg-secondary/20 text-secondary',
  Chocolate:          'bg-tertiary/20 text-tertiary',
  Beverage:           'bg-secondary/20 text-secondary',
  Honey:              'bg-primary/20 text-primary',
  'Live Resin':       'bg-primary/20 text-primary',
  Shatter:            'bg-tertiary/20 text-tertiary',
  Rosin:              'bg-secondary/20 text-secondary',
  Wax:                'bg-tertiary/20 text-tertiary',
  Cartridge:          'bg-secondary/20 text-secondary',
  Disposable:         'bg-primary/20 text-primary',
  'Single Joint':     'bg-primary/20 text-primary',
  '5-Pack Infused':   'bg-tertiary/20 text-tertiary',
  Moonrock:           'bg-primary/20 text-primary',
  CBD:                'bg-secondary/20 text-secondary',
  Salve:              'bg-secondary/20 text-secondary',
  Patch:              'bg-tertiary/20 text-tertiary',
}

const CATEGORY_ICONS = {
  flower:       'local_florist',
  edibles:      'cake',
  concentrates: 'science',
  vapes:        'air',
  prerolls:     'smoking_rooms',
  topicals:     'healing',
}

export default function ProductModal({ product, onClose }) {
  const { addItem, checkLimit } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [limitWarning, setLimitWarning] = useState(null)

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0

  // Auto-select first in-stock variant
  useEffect(() => {
    if (hasVariants) {
      const firstAvailable = product.variants.find((v) => v.inStock)
      if (firstAvailable) setSelectedVariant(firstAvailable)
    }
  }, [hasVariants, product.variants])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!product) return null

  const typeColor  = TYPE_COLORS[product.type] || 'bg-surface-container text-on-surface-variant'
  const icon       = CATEGORY_ICONS[product.category] || 'inventory_2'

  const isAllOutOfStock = hasVariants
    ? product.variants.every((v) => !v.inStock)
    : product.available === false

  // The price shown in the bottom bar
  const displayPrice = hasVariants
    ? selectedVariant?.price ?? null
    : product.price ?? null

  const handleAdd = () => {
    setLimitWarning(null)

    // Build cart item
    const cartItem = hasVariants && selectedVariant
      ? {
          ...product,
          // Unique ID per variant so each size is a separate cart line
          id:           `${product.id}__${selectedVariant.size}`,
          productId:    product.id,
          variant:      selectedVariant.size,
          price:        selectedVariant.price,
          medicalPrice: getMedicalPrice(selectedVariant),
          recreationalPrice: getRecreationalPrice(selectedVariant),
          gramsPerUnit: selectedVariant.gramsPerUnit,
          biotrackInventoryId: selectedVariant.biotrackInventoryId,
          barcodes: selectedVariant.barcodes,
          biotrackLocation: selectedVariant.biotrackLocation || product.biotrackLocation,
        }
      : {
          ...product,
          medicalPrice: getMedicalPrice(product),
          recreationalPrice: getRecreationalPrice(product),
        }

    const limitCheck = checkLimit(cartItem)
    if (limitCheck.exceeded) {
      setLimitWarning(
        `NM purchase limit: ${limitCheck.current}${limitCheck.unit} of ${limitCheck.limitName} already in cart. ` +
        `Adding ${limitCheck.adding}${limitCheck.unit} would exceed the ${limitCheck.limit}${limitCheck.unit} limit.`
      )
      return
    }

    addItem(cartItem)
    onClose()
  }

  const canAdd = !isAllOutOfStock && (!hasVariants || (selectedVariant && selectedVariant.inStock))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div
        className="relative w-full max-w-lg bg-surface-container rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative aspect-video bg-surface-container-high flex items-center justify-center">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant/20" style={{ fontSize: 80 }}>
              {icon}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent" />
          <span className={`absolute top-4 left-4 text-[9px] font-black uppercase px-3 py-1 rounded-full ${typeColor}`}>
            {product.type}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-headline font-black mb-1">{product.name}</h2>
          <p className="text-xs font-label text-on-surface-variant/50 uppercase tracking-widest mb-4">
            {product.category}
          </p>

          {/* Stats row */}
          {(product.thc || product.cbd || product.terpenes) && (
            <div className="flex gap-3 mb-5 flex-wrap">
              {product.thc && (
                <div className="card px-3 py-2 text-center min-w-[70px]">
                  <p className="text-xs font-label text-on-surface-variant/50 uppercase tracking-widest mb-0.5">THC</p>
                  <p className="font-headline font-bold text-sm text-primary neon-glow-pink">{product.thc}</p>
                </div>
              )}
              {product.cbd && (
                <div className="card px-3 py-2 text-center min-w-[70px]">
                  <p className="text-xs font-label text-on-surface-variant/50 uppercase tracking-widest mb-0.5">CBD</p>
                  <p className="font-headline font-bold text-sm text-secondary neon-glow-cyan">{product.cbd}</p>
                </div>
              )}
              {product.terpenes && (
                <div className="card px-3 py-2 text-center min-w-[70px]">
                  <p className="text-xs font-label text-on-surface-variant/50 uppercase tracking-widest mb-0.5">Terps</p>
                  <p className="font-headline font-bold text-sm text-tertiary">{product.terpenes}</p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-on-surface-variant font-body text-sm leading-relaxed mb-5">
              {product.description}
            </p>
          )}

          {/* ── Variant selector ─────────────────────────────────────── */}
          {hasVariants && (
            <div className="mb-5">
              <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50 mb-3">
                Select Size
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.size === v.size
                  return (
                    <button
                      key={v.size}
                      disabled={!v.inStock}
                      onClick={() => { setSelectedVariant(v); setLimitWarning(null) }}
                      className={`relative px-4 py-2 rounded-lg border text-xs font-headline font-bold transition-all
                        ${!v.inStock
                          ? 'border-white/5 text-on-surface-variant/25 cursor-not-allowed line-through'
                          : isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-white/10 text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
                        }`}
                    >
                      <span>{v.size}</span>
                      {v.inStock && (
                        <span className={`block text-[10px] mt-0.5 font-label ${isSelected ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                          Med {formatCurrency(getMedicalPrice(v))}
                          <span className="block text-[9px]">
                            Rec {formatCurrency(getRecreationalPrice(v))}
                          </span>
                        </span>
                      )}
                      {!v.inStock && (
                        <span className="block text-[9px] mt-0.5 font-label text-on-surface-variant/30">
                          sold out
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Limit warning */}
          {limitWarning && (
            <div className="mb-4 bg-error-container/20 border border-error/30 rounded-lg px-4 py-2 text-xs text-error font-body leading-relaxed">
              <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: 14 }}>warning</span>
              {limitWarning}
            </div>
          )}

          {/* Out of stock notice */}
          {isAllOutOfStock && (
            <div className="mb-4 bg-surface-container border border-white/5 rounded-lg px-4 py-3 text-xs text-on-surface-variant font-body text-center">
              This item is currently out of stock. Check back soon or ask our staff about availability.
            </div>
          )}

          {/* Price + Add button */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div>
              {displayPrice != null ? (
                <div>
                  <span className="text-2xl font-headline font-black text-secondary neon-glow-cyan">
                    {getPriceDisplay(hasVariants ? selectedVariant : product)}
                  </span>
                  <p className="text-[10px] font-label text-on-surface-variant/50 mt-1">
                    Medical and recreational prices are managed by staff.
                  </p>
                </div>
              ) : (
                <span className="text-sm text-on-surface-variant font-label">Select a size</span>
              )}
            </div>
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className={`btn-primary btn-pulse ${!canAdd ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_shopping_cart</span>
              {isAllOutOfStock ? 'OUT OF STOCK' : 'ADD TO RESERVATION'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
