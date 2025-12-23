import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Check, Shield, Loader2 } from 'lucide-react'

const STRIPE_CHECKOUT_URL = import.meta.env.VITE_STRIPE_CHECKOUT_URL || ''
const TRIAL_DAYS = 14

export default function Pricing() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    checkSubscription()
  }, [user])

  const checkSubscription = async () => {
    if (!user) return
    
    // Check user's subscription status
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (sub?.plan === 'premium' && sub?.status === 'active') {
      setIsPremium(true)
      return
    }

    // Calculate trial days left from account creation
    const createdAt = new Date(user.created_at)
    const now = new Date()
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const daysLeft = Math.max(0, TRIAL_DAYS - daysSinceCreation)
    setTrialDaysLeft(daysLeft)
  }

  const handleUpgrade = async () => {
    if (!user || !STRIPE_CHECKOUT_URL) {
      alert('Stripe not configured. Set VITE_STRIPE_CHECKOUT_URL')
      return
    }
    setLoading(true)
    const checkoutUrl = `${STRIPE_CHECKOUT_URL}?client_reference_id=${user.id}&prefilled_email=${encodeURIComponent(user.email || '')}`
    window.location.href = checkoutUrl
  }

  const features = [
    'Unlimited password storage',
    'Scheduled unlock windows',
    'Emergency access',
    'Encrypted offline export',
    'Priority support',
  ]

  return (
    <div className="min-h-screen bg-[#F4F7F6] p-6">
      <div className="mx-auto max-w-[480px] pt-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[14px] text-[#7F8C8D] hover:text-[#2C3E50] mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="text-center mb-8 animate-fade-up">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#338089]">
            <Shield className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-[24px] font-bold text-[#2C3E50] mb-2">
            {isPremium ? 'You\'re on Premium!' : 'Upgrade to Premium'}
          </h1>
          <p className="text-[14px] text-[#7F8C8D]">
            {isPremium 
              ? 'Thank you for supporting Password Locker'
              : trialDaysLeft !== null && trialDaysLeft > 0
                ? `${trialDaysLeft} days left in your free trial`
                : 'Your free trial has ended'
            }
          </p>
        </div>

        <Card className="border-[#E5E8E8] bg-white rounded-[12px] card-shadow animate-fade-up delay-1">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-[18px] font-bold text-[#2C3E50]">Premium</CardTitle>
            <div className="mt-2">
              <span className="text-[36px] font-bold text-[#2C3E50]">$4.99</span>
              <span className="text-[14px] text-[#7F8C8D]">/month</span>
            </div>
            <CardDescription className="text-[14px] text-[#7F8C8D] mt-2">
              Full features for serious self-discipline
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <ul className="space-y-3 mb-6">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-[14px]">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#338089]/10">
                    <Check className="h-3 w-3 text-[#338089]" />
                  </div>
                  <span className="text-[#2C3E50]">{feature}</span>
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="rounded-[8px] bg-[#338089]/10 border border-[#338089]/20 p-4 text-center">
                <p className="text-[14px] text-[#338089] font-medium">✓ Premium Active</p>
              </div>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full h-11 rounded-[8px] bg-[#EF7E5B] hover:bg-[#D16A4A] text-white text-[14px] font-semibold"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                ) : (
                  'Upgrade Now'
                )}
              </Button>
            )}

            {!isPremium && trialDaysLeft !== null && trialDaysLeft > 0 && (
              <p className="mt-4 text-center text-[12px] text-[#95A5A6]">
                Continue free for {trialDaysLeft} more days
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trial info */}
        {!isPremium && (
          <div className="mt-6 text-center animate-fade-up delay-2">
            <p className="text-[12px] text-[#95A5A6]">
              14-day free trial included • Cancel anytime
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
