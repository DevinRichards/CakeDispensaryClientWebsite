import { useEffect, useRef } from 'react'

/**
 * Wraps children in a scroll-reveal container.
 * @param {string}  variant  - 'up' (default) | 'left' | 'scale'
 * @param {number}  delay    - transition-delay in ms
 * @param {string}  className - extra classes on the wrapper
 * @param {string}  as       - element tag, default 'div'
 */
export default function FadeIn({
  children,
  variant = 'up',
  delay = 0,
  className = '',
  as: Tag = 'div',
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const revealClass =
    variant === 'left'  ? 'reveal-left' :
    variant === 'scale' ? 'reveal-scale' :
    'reveal'

  return (
    <Tag
      ref={ref}
      className={`${revealClass} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
