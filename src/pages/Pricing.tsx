import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Check, Lock, Zap, Heart, Loader2 } from 'lucide-react'

const STRIPE_CHECKOUT_URL = import.meta.env.VITE_STRIPE_CHECKOUT_URL || ''
const EVERY_ORG_DONATE_URL = 'https://www.every.org/donate'

type Plan = {
  id: string
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
  href?: string
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/forever',
    description: 'Basic password locking with typing challenges',
    features: [
      'Store up to 3 passwords',
      'Typing challenge retrieval',
      'Emergency access (24h delay)',
      'Basic encryption',
    ],
    cta: 'Current Plan',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$4.99',
    period: '/month',
    description: 'Full features for serious self-discipline',
    features: [
      'Unlimited passwords',
      'Scheduled unlock windows',
      'Emergency access (customizable delay)',
      'Offline encrypted export',
      'Priority support',
      'Browser extension (coming soon)',
    ],
    cta: 'Upgrade to Premium',
    popular: true,
  },
]

export default function Pricing() {
  const { user } = useAuth()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [loadingDonate, setLoadingDonate] = useState(false)

  const handleSubscribe = async (planId: string) => {
    if (!user || !STRIPE_CHECKOUT_URL) {
      alert('Stripe is not configured. Please set VITE_STRIPE_CHECKOUT_URL in your environment.')
      return
    }

    setLoadingPlan(planId)
    
    try {
      // Redirect to Stripe Checkout
      // In production, you'd create a checkout session via your backend
      const checkoutUrl = `${STRIPE_CHECKOUT_URL}?client_reference_id=${user.id}&prefilled_email=${encodeURIComponent(user.email || '')}`
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Error starting checkout:', error)
      alert('Failed to start checkout. Please try again.')
    }
    
    setLoadingPlan(null)
  }

  const handleDonate = () => {
    setLoadingDonate(true)
    // Redirect to Every.org donation page
    window.location.href = EVERY_ORG_DONATE_URL
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-4xl pt-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="text-center mb-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Choose Your Plan</h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Upgrade for more features, or skip the typing challenge with a donation to charity.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative border-slate-800/50 bg-slate-900/30 backdrop-blur-xl shadow-xl ${
                plan.popular ? 'ring-2 ring-emerald-500/50' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-white">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <CardDescription className="text-slate-400 mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => plan.id === 'premium' && handleSubscribe(plan.id)}
                  disabled={plan.id === 'free' || loadingPlan === plan.id}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : plan.popular ? (
                    <Zap className="mr-2 h-4 w-4" />
                  ) : null}
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charity Skip Option */}
        <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-rose-500/5 backdrop-blur-xl shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/10">
              <Heart className="h-6 w-6 text-pink-400" />
            </div>
            <CardTitle className="text-xl font-bold text-white">Skip with a Donation</CardTitle>
            <CardDescription className="text-slate-400">
              Donate $5 to charity and skip the typing challenge for your next retrieval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-slate-400">
              Instead of completing the typing challenge, you can donate $5 to a charity of your choice through Every.org. 
              After donating, you'll receive a skip code to bypass the challenge once.
            </p>
            <Button
              onClick={handleDonate}
              disabled={loadingDonate}
              variant="outline"
              className="border-pink-500/30 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300"
            >
              {loadingDonate ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Heart className="mr-2 h-4 w-4" />
              )}
              Donate $5 to Skip
            </Button>
            <p className="text-xs text-slate-500">
              Powered by Every.org — 100% goes to charity
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

