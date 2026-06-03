import { useState } from 'react'
import { useCart } from '../context/CartContext'
import ProductModal from './ProductModal'
import { getPriceDisplay } from '../utils/pricing'

const TYPE_COLORS = {
  'Indica Dominant':  'bg-primary text-on-primary',
  'Sativa Dominant':  'bg-secondary text-on-secondary',
  'Balanced Hybrid':  'bg-tertiary text-on-tertiary',
  Gummies:            'bg-secondary text-on-secondary',
  Chocolate:          'bg-secondary text-on-secondary',
  Beverage:           'bg-secondary text-on-secondary',
  Honey:              'bg-secondary text-on-secondary',
  'Live Resin':       'bg-tertiary text-on-tertiary',
  Shatter:            'bg-tertiary text-on-tertiary',
  Rosin:              'bg-tertiary text-on-tertiary',
  Wax:                'bg-tertiary text-on-tertiary',
  Cartridge:          'bg-secondary text-on-secondary',
  Disposable:         'bg-primary text-on-primary',
  BHO:                'bg-tertiary text-on-tertiary',
  'Single Joint':     'bg-primary text-on-primary',
  '5-Pack Infused':   'bg-primary text-on-primary',
  Moonrock:           'bg-primary text-on-primary',
  CBD:                'bg-secondary text-on-secondary',
  Salve:              'bg-secondary text-on-secondary',
  Patch:              'bg-secondary text-on-secondary',
}

const PLACEHOLDER_ICONS = {
  flower:       'local_florist',
  edibles:      'cake',
  drinks:       'local_cafe',
  concentrates: 'science',
  vapes:        'air',
  prerolls:     'smoking_rooms',
  topicals:     'healing',
}

export default function ProductCard({ product }) {
  const { addItem, checkLimit } = useCart()
  const [showModal, setShowModal] = useState(false)

  const badgeClass = TYPE_COLORS[product.type] || 'bg-outline text-on-surface'
  const placeholderIcon = PLACEHOLDER_ICONS[product.category] || 'local_florist'

  // ── Availability ──────────────────────────────────────────────────────────
  const hasVariants  = Array.isArray(product.variants) && product.variants.length > 0
  const anyInStock   = hasVariants
    ? product.variants.some((v) => v.inStock)
    : product.available !== false
  const isOutOfStock = !anyInStock

  // Display price — "from $X" for variants, fixed otherwise
  const displayPrice = hasVariants
    ? (() => {
        const cheapest = product.variants.find((v) => v.inStock) || product.variants[0]
        const price = getPriceDisplay(cheapest)
        return price ? `from ${price}` : null
      })()
    : getPriceDisplay(product)

  const handleQuickAdd = (e) => {
    e.stopPropagation()
    const limitCheck = checkLimit(product)
    if (limitCheck.exceeded) {
      alert(`NM purchase limit reached for ${limitCheck.limitName}: ${limitCheck.current}${limitCheck.unit} in cart, limit is ${limitCheck.limit}${limitCheck.unit}.`)
      return
    }
    addItem({ ...product })
  }

  return (
    <>
      <div className={`group card transition-all duration-300 overflow-hidden flex flex-col ${isOutOfStock ? 'opacity-60' : 'hover:-translate-y-1'}`}>

        {/* Image — click opens modal */}
        <button
          onClick={() => setShowModal(true)}
          className="aspect-square relative overflow-hidden bg-surface-container text-left w-full"
          aria-label={`View details for ${product.name}`}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${!isOutOfStock ? 'group-hover:scale-110' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant/20" style={{ fontSize: 72 }}>
                {placeholderIcon}
              </span>
            </div>
          )}

          {/* Type badge */}
          <span className={`absolute top-3 left-3 text-[9px] font-black uppercase px-2 py-0.5 rounded ${badgeClass}`}>
            {product.type}
          </span>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-surface-container-high border border-white/20 text-on-surface text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest">
                Out of Stock
              </span>
            </div>
          )}

          {/* Sizes available badge */}
          {hasVariants && !isOutOfStock && (
            <div className="absolute bottom-3 right-3 bg-black/60 rounded-full px-2 py-0.5">
              <span className="text-[9px] font-label text-white/80 uppercase tracking-wide">
                {product.variants.filter((v) => v.inStock).length} sizes
              </span>
            </div>
          )}

          {/* Hover hint */}
          {!isOutOfStock && (
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
              <span className="text-[10px] font-label uppercase tracking-widest text-on-surface/80">
                {hasVariants ? 'Select Size' : 'View Details'}
              </span>
            </div>
          )}
        </button>

        {/* Card body */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <button
              onClick={() => setShowModal(true)}
              className="font-headline font-bold text-sm sm:text-base leading-tight text-left hover:text-primary transition-colors"
            >
              {product.name}
            </button>
            {displayPrice && (
              <span className="text-secondary font-headline font-bold ml-2 shrink-0 text-[11px] sm:text-xs text-right max-w-[150px]">
                {displayPrice}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-4 text-xs text-on-surface-variant font-label">
            {product.thc && <span>THC {product.thc}</span>}
            {product.cbd && <span>CBD {product.cbd}</span>}
            {product.terpenes && <span>Terps {product.terpenes}</span>}
          </div>

          {product.description && (
            <p className="text-on-surface-variant text-xs font-body leading-relaxed mb-4 flex-1 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Action button */}
          {isOutOfStock ? (
            <div className="mt-auto w-full py-2.5 text-center rounded border border-outline-variant/10
                            font-headline text-xs font-bold tracking-wider text-on-surface-variant/30 cursor-not-allowed select-none">
              OUT OF STOCK
            </div>
          ) : hasVariants ? (
            <button
              onClick={() => setShowModal(true)}
              className="mt-auto w-full py-2.5 bg-surface-container-highest border border-outline-variant/20 rounded
                         font-headline text-xs font-bold tracking-wider
                         hover:bg-primary hover:text-on-primary hover:border-transparent
                         active:scale-95 transition-all btn-pulse"
            >
              SELECT SIZE →
            </button>
          ) : (
            <button
              onClick={handleQuickAdd}
              className="mt-auto w-full py-2.5 bg-surface-container-highest border border-outline-variant/20 rounded
                         font-headline text-xs font-bold tracking-wider
                         hover:bg-primary hover:text-on-primary hover:border-transparent
                         active:scale-95 transition-all btn-pulse"
            >
              + ADD TO RESERVATION
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <ProductModal product={product} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
