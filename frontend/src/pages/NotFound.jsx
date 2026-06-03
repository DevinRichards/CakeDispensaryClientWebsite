import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'

export default function NotFound() {
  usePageTitle('Page Not Found')
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,124,245,0.05)_0%,transparent_70%)] pointer-events-none" />
      <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 mb-4">404</p>
      <h1 className="text-7xl font-headline font-black tracking-tighter mb-4">
        <span className="text-primary neon-glow-pink">Page</span> Not Found
      </h1>
      <p className="text-on-surface-variant font-body text-lg mb-10 max-w-md">
        Looks like this page took a smoke break. Let's get you back to the good stuff.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/" className="btn-primary btn-pulse justify-center">GO HOME</Link>
        <Link to="/menu" className="btn-outline justify-center">BROWSE MENU</Link>
      </div>
    </div>
  )
}
