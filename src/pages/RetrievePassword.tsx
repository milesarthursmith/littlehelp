import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase, type PasswordVault, type ScheduledUnlock, type EmergencyAccessRequest, isWithinScheduledUnlock, isEmergencyAccessReady } from '@/lib/supabase'
import { decryptPassword } from '@/lib/encryption'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Leaf, Copy, Check, Eye, EyeOff, Clock, AlertTriangle, Calendar } from 'lucide-react'

// Mindfulness-themed typing passages
const TYPING_PASSAGES = [
  `The path to self-discipline begins with small, consistent choices. Each time you resist an impulse, you strengthen your ability to focus on what truly matters. This moment of friction is not a barrier—it is a gift. By taking the time to complete this challenge, you are proving to yourself that you have the patience and determination to overcome distraction. Remember why you set these boundaries in the first place. Your future self will thank you for the discipline you show today. Keep typing, stay focused, and trust the process.`,
  `Discipline is choosing between what you want now and what you want most. The temporary pleasure of distraction fades quickly, but the satisfaction of staying focused compounds over time. Every keystroke here is a small victory, a proof that you can delay gratification when it matters. You are rewiring your brain, one moment at a time. The urge that brought you here will pass, as all urges do. When you look back on this moment, you will be grateful you persisted.`,
  `Success is not about having more willpower than others. It is about designing your environment and habits so that the right choice becomes the easy choice. That is exactly what you are doing right now. By creating friction between yourself and distraction, you are making focus the path of least resistance. This typing challenge is your ally, not your enemy. Embrace it, complete it, and remember this feeling of accomplishment.`,
]

const EMERGENCY_DELAY_HOURS = 24

export default function RetrievePassword() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vault, setVault] = useState<PasswordVault | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'checking' | 'scheduled' | 'emergency-pending' | 'typing' | 'master' | 'reveal'>('checking')
  
  const [, setSchedules] = useState<ScheduledUnlock[]>([])
  const [isScheduledUnlock, setIsScheduledUnlock] = useState(false)
  
  const [emergencyRequest, setEmergencyRequest] = useState<EmergencyAccessRequest | null>(null)
  const [emergencyCountdown, setEmergencyCountdown] = useState('')
  const [requestingEmergency, setRequestingEmergency] = useState(false)
  
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [errors, setErrors] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [masterPassword, setMasterPassword] = useState('')
  const [showMaster, setShowMaster] = useState(false)
  const [decryptError, setDecryptError] = useState('')
  const [decrypting, setDecrypting] = useState(false)
  
  const [revealedPassword, setRevealedPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const currentPassage = TYPING_PASSAGES[currentPassageIndex]
  const totalPassages = TYPING_PASSAGES.length

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    if (!emergencyRequest || emergencyRequest.cancelled) return
    
    const updateCountdown = () => {
      const unlockTime = new Date(emergencyRequest.unlock_at)
      const now = new Date()
      const diff = unlockTime.getTime() - now.getTime()
      
      if (diff <= 0) {
        setEmergencyCountdown('Ready!')
        setStep('master')
        return
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setEmergencyCountdown(`${hours}h ${minutes}m ${seconds}s`)
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [emergencyRequest])

  const fetchData = async () => {
    if (!id) return

    const { data: vaultData, error: vaultError } = await supabase
      .from('password_vaults')
      .select('*')
      .eq('id', id)
      .single()

    if (vaultError) {
      console.error('Error fetching vault:', vaultError)
      navigate('/dashboard')
      return
    }
    setVault(vaultData)

    const { data: scheduleData } = await supabase
      .from('scheduled_unlocks')
      .select('*')
      .eq('vault_id', id)
      .eq('enabled', true)

    const scheduledUnlocks = scheduleData || []
    setSchedules(scheduledUnlocks)

    if (isWithinScheduledUnlock(scheduledUnlocks)) {
      setIsScheduledUnlock(true)
      setStep('scheduled')
      setLoading(false)
      return
    }

    const { data: emergencyData } = await supabase
      .from('emergency_access_requests')
      .select('*')
      .eq('vault_id', id)
      .eq('cancelled', false)
      .is('completed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (emergencyData) {
      setEmergencyRequest(emergencyData)
      if (isEmergencyAccessReady(emergencyData)) {
        setStep('master')
      } else {
        setStep('emergency-pending')
      }
    } else {
      setStep('typing')
    }

    setLoading(false)
  }

  const handleRequestEmergencyAccess = async () => {
    if (!vault) return
    setRequestingEmergency(true)

    const unlockAt = new Date()
    unlockAt.setHours(unlockAt.getHours() + EMERGENCY_DELAY_HOURS)

    const { data, error } = await supabase
      .from('emergency_access_requests')
      .insert({
        vault_id: vault.id,
        user_id: vault.user_id,
        unlock_at: unlockAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating emergency request:', error)
      if (error.code === '42P01') {
        alert('Database table not found. Please run the latest supabase-schema.sql in your Supabase SQL Editor.')
      } else {
        alert(`Failed to create emergency access request: ${error.message}`)
      }
    } else {
      setEmergencyRequest(data)
      setStep('emergency-pending')
    }
    setRequestingEmergency(false)
  }

  const handleCancelEmergency = async () => {
    if (!emergencyRequest) return

    await supabase
      .from('emergency_access_requests')
      .update({ cancelled: true })
      .eq('id', emergencyRequest.id)

    setEmergencyRequest(null)
    setStep('typing')
  }

  const handleTypingChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const targetChar = currentPassage[value.length - 1]
    const typedChar = value[value.length - 1]

    if (typedChar !== targetChar && value.length > typedText.length) {
      setErrors(prev => prev + 1)
      return
    }

    setTypedText(value)

    if (value === currentPassage) {
      if (currentPassageIndex < totalPassages - 1) {
        setCurrentPassageIndex(currentPassageIndex + 1)
        setTypedText('')
      } else {
        setStep('master')
      }
    }
  }, [typedText.length, currentPassage, currentPassageIndex, totalPassages])

  const overallProgress = Math.round(
    ((currentPassageIndex * 100) + (typedText.length / currentPassage.length * 100)) / totalPassages
  )

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vault) return

    setDecrypting(true)
    setDecryptError('')

    try {
      const decrypted = await decryptPassword(
        {
          ciphertext: vault.encrypted_password,
          iv: vault.iv,
          salt: vault.salt,
        },
        masterPassword
      )
      setRevealedPassword(decrypted)
      setStep('reveal')

      if (emergencyRequest) {
        await supabase
          .from('emergency_access_requests')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', emergencyRequest.id)
      }
    } catch {
      setDecryptError('Invalid master password. Please try again.')
    }
    setDecrypting(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(revealedPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2d9d92] border-t-transparent" />
          <div className="text-[#718096]">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] p-4">
      <div className="mx-auto max-w-2xl pt-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center text-[#718096] hover:text-[#2d3748] transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card className="border-[#e2ddd5] bg-white card-shadow animate-fade-up">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f4f3]">
              <Leaf className="h-7 w-7 text-[#2d9d92]" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-2xl text-[#2d3748]" style={{ fontFamily: 'Newsreader, serif' }}>
              {step === 'checking' && 'Checking Access...'}
              {step === 'scheduled' && 'Scheduled Unlock'}
              {step === 'emergency-pending' && 'Emergency Access Pending'}
              {step === 'typing' && `Mindful Typing (${currentPassageIndex + 1}/${totalPassages})`}
              {step === 'master' && 'Enter Master Password'}
              {step === 'reveal' && 'Password Retrieved'}
            </CardTitle>
            <CardDescription className="text-[#718096]">
              {step === 'scheduled' && 'You are within a scheduled unlock window'}
              {step === 'emergency-pending' && `Access available in ${emergencyCountdown}`}
              {step === 'typing' && `Retrieving: ${vault?.name}`}
              {step === 'master' && 'Enter your master password to decrypt'}
              {step === 'reveal' && vault?.name}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Scheduled Unlock */}
            {step === 'scheduled' && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-lg bg-[#e8f4f3] border border-[#2d9d92]/20 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-5 w-5 text-[#2d9d92]" />
                    <span className="font-medium text-[#2d9d92]">Scheduled Unlock Active</span>
                  </div>
                  <p className="text-sm text-[#718096]">
                    No typing challenge required during this window.
                  </p>
                </div>
                <Button 
                  onClick={() => setStep('master')}
                  className="w-full bg-[#2d9d92] hover:bg-[#237a72] text-white"
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Emergency Pending */}
            {step === 'emergency-pending' && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="font-medium text-amber-700">Emergency Access Requested</span>
                  </div>
                  <p className="text-sm text-[#718096] mb-4">
                    Your password will be available in:
                  </p>
                  <p className="text-3xl font-semibold text-[#2d3748] text-center" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {emergencyCountdown}
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={handleCancelEmergency}
                  className="w-full border-[#e2ddd5] text-[#718096] hover:bg-[#f5f1eb]"
                >
                  Cancel & Type Instead
                </Button>
                <p className="text-center text-xs text-[#a0aec0]">
                  The waiting period helps prevent impulsive access
                </p>
              </div>
            )}

            {/* Typing Challenge */}
            {step === 'typing' && (
              <div className="space-y-6 animate-fade-in">
                {/* Emergency option */}
                <div className="rounded-lg bg-[#f5f1eb] border border-[#e2ddd5] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-[#718096]">Need emergency access?</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRequestEmergencyAccess}
                      disabled={requestingEmergency}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    >
                      {requestingEmergency ? 'Requesting...' : `${EMERGENCY_DELAY_HOURS}h wait`}
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#718096]">Overall Progress</span>
                    <span className="text-[#2d9d92] font-medium">{overallProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e8f4f3]">
                    <div
                      className="h-full bg-[#2d9d92] transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Passage */}
                <div className="rounded-xl bg-[#faf8f5] border border-[#e2ddd5] p-5 text-base leading-relaxed" style={{ fontFamily: 'Newsreader, serif' }}>
                  <span className="text-[#2d9d92]">{typedText}</span>
                  <span className="animate-pulse text-[#2d9d92]">|</span>
                  <span className="text-[#a0aec0]">{currentPassage.slice(typedText.length)}</span>
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <Input
                    ref={inputRef}
                    value={typedText}
                    onChange={handleTypingChange}
                    placeholder="Start typing..."
                    className="h-12 border-[#e2ddd5] bg-white text-[#2d3748] placeholder:text-[#a0aec0] focus:border-[#2d9d92] focus:ring-2 focus:ring-[#2d9d92]/10"
                    autoFocus
                  />
                  {errors > 0 && (
                    <p className="text-sm text-amber-600">
                      {errors} error{errors !== 1 ? 's' : ''} — breathe, type carefully
                    </p>
                  )}
                </div>

                <p className="text-center text-sm text-[#a0aec0]">
                  Complete all {totalPassages} passages mindfully
                </p>
              </div>
            )}

            {/* Master Password */}
            {step === 'master' && (
              <form onSubmit={handleMasterSubmit} className="space-y-4 animate-fade-in">
                {isScheduledUnlock && (
                  <div className="rounded-lg bg-[#e8f4f3] border border-[#2d9d92]/20 p-3 text-sm text-[#2d9d92]">
                    ✓ Scheduled unlock — challenge skipped
                  </div>
                )}
                {emergencyRequest && isEmergencyAccessReady(emergencyRequest) && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                    ✓ Emergency access granted
                  </div>
                )}
                {decryptError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {decryptError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="master" className="text-[#4a5568] font-medium">Master Password</Label>
                  <div className="relative">
                    <Input
                      id="master"
                      type={showMaster ? 'text' : 'password'}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 border-[#e2ddd5] bg-[#faf8f5] text-[#2d3748] pr-10 focus:border-[#2d9d92] font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowMaster(!showMaster)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0aec0] hover:text-[#718096] transition-colors"
                    >
                      {showMaster ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#2d9d92] hover:bg-[#237a72] text-white"
                  disabled={decrypting || !masterPassword}
                >
                  {decrypting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Decrypting...
                    </span>
                  ) : (
                    'Unlock Password'
                  )}
                </Button>
              </form>
            )}

            {/* Reveal */}
            {step === 'reveal' && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-xl bg-[#faf8f5] border border-[#e2ddd5] p-6 text-center">
                  <p className="mb-3 text-sm text-[#718096]">Your password:</p>
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-3xl tracking-wider text-[#2d3748]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {showPassword ? revealedPassword : '••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#a0aec0] hover:text-[#718096] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="flex-1 border-[#e2ddd5] text-[#718096] hover:bg-[#f5f1eb]"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Link to="/dashboard" className="flex-1">
                    <Button className="w-full bg-[#2d9d92] hover:bg-[#237a72] text-white">
                      Done
                    </Button>
                  </Link>
                </div>

                <p className="text-center text-sm text-[#a0aec0]">
                  Password hidden when you leave this page
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
