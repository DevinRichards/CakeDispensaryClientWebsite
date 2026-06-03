import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SignIn as ClerkSignIn, SignUp as ClerkSignUp } from '@clerk/react'
import { useUser } from '../context/UserContext'
import usePageTitle from '../hooks/usePageTitle'

const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

const CUSTOMER_PERKS = [
  { icon: 'receipt_long',       title: 'Order history',  desc: 'View all your confirmed pickup reservations from any device.' },
  { icon: 'replay',             title: 'Order again',    desc: 'One tap to reload your cart from any past order.' },
  { icon: 'notifications_active', title: 'Live status',  desc: 'See whether your most recent order is pending or confirmed.' },
]

const STAFF_PERKS = [
  { icon: 'restaurant_menu',    title: 'Menu & pricing', desc: 'Edit products, set prices, and manage hidden items.' },
  { icon: 'shopping_basket',    title: 'Reservations',   desc: 'Confirm, cancel, and complete customer pickup orders.' },
  { icon: 'point_of_sale',      title: 'BioTrack sync',  desc: 'Live NM Trace inventory status and connection health.' },
]

const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: '#ff2d78',
    borderRadius: '12px',
    fontFamily:   'inherit',
  },
  elements: {
    rootBox:           'w-full flex justify-center',
    card:              'shadow-none border-0 bg-transparent p-0',
    headerTitle:       'hidden',
    headerSubtitle:    'hidden',
    formButtonPrimary: 'uppercase tracking-[0.15em] text-sm font-bold',
    footerActionLink:  'font-bold',
  },
}

export default function SignIn() {
  usePageTitle('Sign In')
  const location  = useLocation()
  const navigate  = useNavigate()
  const { isSignedIn } = useUser()

  const params    = new URLSearchParams(location.search)
  const isStaff   = params.get('type') === 'staff'
  const showSignUp = !isStaff && params.get('mode') === 'sign-up'

  // Redirect signed-in customers away from this page
  useEffect(() => {
    if (isSignedIn && !isStaff) navigate('/profile', { replace: true })
  }, [isSignedIn, isStaff, navigate])

  const headerLabel = isStaff ? 'Staff Access' : showSignUp ? 'New Account' : 'Welcome Back'
  const headerTitle = isStaff ? 'Admin sign-in' : showSignUp ? 'Start your account' : 'Access your profile'
  const perks       = isStaff ? STAFF_PERKS : CUSTOMER_PERKS

  // Staff redirect goes straight to admin, customers go to profile
  const redirectUrl = isStaff ? '/admin' : '/profile'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Left — perks panel */}
        <div>
          <span className="font-label uppercase tracking-widest text-xs font-bold text-primary block mb-4">
            {isStaff ? 'Staff Portal' : 'Cake Account'}
          </span>
          <h1 className="text-5xl lg:text-7xl font-headline font-black tracking-tighter leading-[0.9] mb-6">
            {isStaff ? 'Staff\nSign In' : showSignUp ? 'Create\nAccount' : 'Sign In'}
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-10 max-w-md">
            {isStaff
              ? 'Access the admin dashboard to manage orders, inventory, and pricing.'
              : 'Save your reservations, track pickup status, and reorder in one tap.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {perks.map((perk) => (
              <div key={perk.title} className="card p-5">
                <span className="material-symbols-outlined text-primary mb-3 block" style={{ fontSize: 28 }}>
                  {perk.icon}
                </span>
                <h2 className="font-headline font-bold text-base mb-1">{perk.title}</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — white Clerk panel */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">

          {/* Panel header with Customer / Staff toggle */}
          <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between gap-4">
            <div>
              <p className="font-label uppercase tracking-widest text-xs font-bold text-primary mb-1">
                {headerLabel}
              </p>
              <h2 className="font-headline text-2xl font-black tracking-tight text-zinc-900">
                {headerTitle}
              </h2>
            </div>

            {/* Toggle pill */}
            <div className="flex rounded-full bg-zinc-100 p-1 shrink-0">
              <Link
                to="/signin"
                className={`px-4 py-2 rounded-full text-xs font-label font-bold uppercase tracking-widest transition-all ${
                  !isStaff
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Customer
              </Link>
              <Link
                to="/signin?type=staff"
                className={`px-4 py-2 rounded-full text-xs font-label font-bold uppercase tracking-widest transition-all ${
                  isStaff
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Staff
              </Link>
            </div>
          </div>

          {/* Clerk form */}
          <div className="px-8 py-8 flex flex-col items-center">
            {CLERK_ENABLED ? (
              showSignUp ? (
                <ClerkSignUp
                  path="/signin"
                  routing="path"
                  forceRedirectUrl={redirectUrl}
                  signInUrl="/signin"
                  appearance={CLERK_APPEARANCE}
                />
              ) : (
                <ClerkSignIn
                  path="/signin"
                  routing="path"
                  forceRedirectUrl={redirectUrl}
                  signUpUrl="/signin?mode=sign-up"
                  appearance={CLERK_APPEARANCE}
                />
              )
            ) : (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-zinc-500 text-sm">
                <p className="font-bold text-zinc-800 mb-1">Sign-in unavailable</p>
                <p>Authentication is not configured yet. Browse the menu as a guest.</p>
              </div>
            )}

            <div className="mt-6 w-full flex items-center justify-between">
              <Link
                to="/menu"
                className="text-primary font-label font-bold uppercase tracking-widest text-xs"
              >
                Back to Menu
              </Link>
              {!isStaff && !showSignUp && CLERK_ENABLED && (
                <p className="text-zinc-500 text-xs">
                  New?{' '}
                  <Link to="/signin?mode=sign-up" className="text-primary font-bold">
                    Create account
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
