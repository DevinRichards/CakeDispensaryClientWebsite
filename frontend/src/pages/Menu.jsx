import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProducts } from '../api'
import ProductCard from '../components/ProductCard'
import usePageTitle from '../hooks/usePageTitle'
import FadeIn from '../components/FadeIn'

const CATEGORIES = [
  { key: '', label: 'All Products', icon: 'apps' },
  { key: 'flower', label: 'Flower', icon: 'local_florist' },
  { key: 'edibles', label: 'Edibles', icon: 'cake' },
  { key: 'drinks', label: 'Drinks', icon: 'local_cafe' },
  { key: 'concentrates', label: 'Concentrates', icon: 'science' },
  { key: 'vapes', label: 'Vapes', icon: 'air' },
  { key: 'prerolls', label: 'Pre-Rolls', icon: 'smoking_rooms' },
  { key: 'topicals', label: 'Topicals', icon: 'healing' },
]

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState('category')

  usePageTitle('Menu')
  const category = searchParams.get('category') || ''

  useEffect(() => {
    setLoading(true)
    getProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const setCategory = (cat) => {
    if (cat) {
      setSearchParams({ category: cat })
    } else {
      setSearchParams({})
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    const visible = products
      .filter((product) => !category || product.category === category)
      .filter((product) => {
        if (inStockOnly) {
          const inStock = Array.isArray(product.variants) && product.variants.length > 0
            ? product.variants.some((variant) => variant.inStock)
            : product.available !== false
          if (!inStock) return false
        }

        if (!q) return true
        return (
          product.name?.toLowerCase().includes(q) ||
          product.type?.toLowerCase().includes(q) ||
          product.description?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => compareProducts(a, b, sortBy))

    return visible
  }, [products, search, inStockOnly, sortBy])

  const grouped = useMemo(() => {
    return CATEGORIES
      .filter((item) => item.key)
      .map((item) => ({
        ...item,
        products: filtered.filter((product) => product.category === item.key),
      }))
      .filter((item) => item.products.length > 0)
  }, [filtered])

  const sectionMode = !category

  return (
    <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-12">
      {/* Header */}
      <FadeIn className="mb-10">
        <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-2">Browse & Reserve</p>
        <h1 className="text-5xl font-headline font-black mb-4">Our Menu</h1>
        <p className="text-on-surface-variant font-body max-w-xl">
          Every product is lab-tested and locally sourced. Add items to your reservation cart and choose a pickup time — no payment needed until you're in-store.
        </p>
      </FadeIn>

      {/* Filters row */}
      <div className="sticky top-20 z-20 mb-8">
        <div className="glass-panel border border-white/5 rounded-2xl p-4 md:p-5 shadow-2xl">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-headline font-bold uppercase tracking-wide transition-all ${
                    category === cat.key
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" style={{ fontSize: 18 }}>search</span>
                <input
                  type="text"
                  placeholder="Search products, strains, or formats..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9 pr-4 py-2.5 w-full text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 lg:shrink-0">
                <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-container text-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-[var(--color-primary)]"
                  />
                  In Stock Only
                </label>

                <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-container text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>swap_vert</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-none outline-none text-on-surface min-w-[150px]"
                  >
                    <option value="category">Category + Name</option>
                    <option value="name">Name A–Z</option>
                    <option value="price-low">Price Low–High</option>
                    <option value="price-high">Price High–Low</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-label text-on-surface-variant/70">
              <span>{loading ? 'Loading products...' : `${filtered.length} products`}</span>
              {inStockOnly && <span className="px-2 py-1 rounded-full bg-secondary/15 text-secondary">In stock only</span>}
              {search && <span className="px-2 py-1 rounded-full bg-primary/15 text-primary">Search: {search}</span>}
              {sortBy !== 'category' && <span className="px-2 py-1 rounded-full bg-tertiary/15 text-tertiary">Sorted</span>}
            </div>
          </div>
        </div>
      </div>

      {sectionMode && grouped.length > 1 && (
        <div className="mb-8 flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            cat.key && grouped.some((group) => group.key === cat.key) ? (
              <button
                key={cat.key}
                onClick={() => document.getElementById(`menu-section-${cat.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="px-3 py-2 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors text-xs font-headline font-bold uppercase tracking-wide"
              >
                {cat.label}
              </button>
            ) : null
          ))}
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-surface-container-high" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-surface-container-high rounded w-3/4" />
                <div className="h-3 bg-surface-container-high rounded w-1/2" />
                <div className="h-8 bg-surface-container-high rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-32">
          <span className="material-symbols-outlined text-on-surface-variant/20 block mb-4" style={{ fontSize: 72 }}>search_off</span>
          <p className="font-headline font-bold text-xl mb-2">No products found</p>
          <p className="text-on-surface-variant font-body text-sm">Try adjusting your search or browsing a different category.</p>
        </div>
      ) : sectionMode ? (
        <div className="space-y-16">
          {grouped.map((group, groupIndex) => (
            <section key={group.key} id={`menu-section-${group.key}`} className="scroll-mt-36">
              <FadeIn delay={groupIndex * 50}>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
                  <div>
                    <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-2">
                      {group.products.length} product{group.products.length !== 1 ? 's' : ''}
                    </p>
                    <h2 className="text-3xl font-headline font-black flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">{group.icon}</span>
                      {group.label}
                    </h2>
                  </div>
                  <button
                    onClick={() => setCategory(group.key)}
                    className="text-sm font-label text-secondary hover:underline text-left md:text-right"
                  >
                    Browse only {group.label.toLowerCase()} →
                  </button>
                </div>
              </FadeIn>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                {group.products.map((product, i) => (
                  <FadeIn key={product.id} variant="scale" delay={Math.min(i % 8, 7) * 45}>
                    <div className="h-full">
                      <ProductCard product={product} />
                    </div>
                  </FadeIn>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
          {filtered.map((product, i) => (
            <FadeIn key={product.id} variant="scale" delay={Math.min(i % 8, 7) * 55}>
              <div className="h-full">
                <ProductCard product={product} />
              </div>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  )
}

function getLowestPrice(product) {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const priced = product.variants
      .map((variant) => variant.price)
      .filter((price) => price != null)
    return priced.length > 0 ? Math.min(...priced) : Number.POSITIVE_INFINITY
  }
  return product.price != null ? product.price : Number.POSITIVE_INFINITY
}

function compareProducts(a, b, sortBy) {
  if (sortBy === 'name') return a.name.localeCompare(b.name)

  if (sortBy === 'price-low') {
    const priceDiff = getLowestPrice(a) - getLowestPrice(b)
    return priceDiff !== 0 ? priceDiff : a.name.localeCompare(b.name)
  }

  if (sortBy === 'price-high') {
    const priceDiff = getLowestPrice(b) - getLowestPrice(a)
    return priceDiff !== 0 ? priceDiff : a.name.localeCompare(b.name)
  }

  if (a.category !== b.category) return a.category.localeCompare(b.category)
  return a.name.localeCompare(b.name)
}
