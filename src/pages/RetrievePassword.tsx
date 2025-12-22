import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase, type PasswordVault, type ScheduledUnlock, type EmergencyAccessRequest, isWithinScheduledUnlock, isEmergencyAccessReady } from '@/lib/supabase'
import { decryptPassword } from '@/lib/encryption'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Lock, Copy, Check, Eye, EyeOff, Clock, AlertTriangle, Calendar } from 'lucide-react'

// Long passage for typing challenge - repeated for longer challenge
const TYPING_PASSAGES = [
  `The path to self-discipline begins with small, consistent choices. Each time you resist an impulse, you strengthen your ability to focus on what truly matters. This moment of friction is not a barrier—it is a gift. By taking the time to complete this challenge, you are proving to yourself that you have the patience and determination to overcome distraction. Remember why you set these boundaries in the first place. Your future self will thank you for the discipline you show today. Keep typing, stay focused, and trust the process.`,
  `Discipline is choosing between what you want now and what you want most. The temporary pleasure of distraction fades quickly, but the satisfaction of staying focused compounds over time. Every keystroke here is a small victory, a proof that you can delay gratification when it matters. You are rewiring your brain, one moment at a time. The urge that brought you here will pass, as all urges do. When you look back on this moment, you will be grateful you persisted.`,
  `Success is not about having more willpower than others. It is about designing your environment and habits so that the right choice becomes the easy choice. That is exactly what you are doing right now. By creating friction between yourself and distraction, you are making focus the path of least resistance. This typing challenge is your ally, not your enemy. Embrace it, complete it, and remember this feeling of accomplishment.`,
]

const EMERGENCY_DELAY_HOURS = 24 // Hours to wait for emergency access

export default function RetrievePassword() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vault, setVault] = useState<PasswordVault | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'checking' | 'scheduled' | 'emergency-pending' | 'typing' | 'master' | 'reveal'>('checking')
  
  // Scheduled unlock state
  const [, setSchedules] = useState<ScheduledUnlock[]>([])
  const [isScheduledUnlock, setIsScheduledUnlock] = useState(false)
  
  // Emergency access state
  const [emergencyRequest, setEmergencyRequest] = useState<EmergencyAccessRequest | null>(null)
  const [emergencyCountdown, setEmergencyCountdown] = useState('')
  const [requestingEmergency, setRequestingEmergency] = useState(false)
  
  // Typing challenge state
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [errors, setErrors] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Master password state
  const [masterPassword, setMasterPassword] = useState('')
  const [showMaster, setShowMaster] = useState(false)
  const [decryptError, setDecryptError] = useState('')
  const [decrypting, setDecrypting] = useState(false)
  
  // Revealed password state
  const [revealedPassword, setRevealedPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const currentPassage = TYPING_PASSAGES[currentPassageIndex]
  const totalPassages = TYPING_PASSAGES.length

  useEffect(() => {
    fetchData()
  }, [id])

  // Update emergency countdown
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

    // Fetch vault
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

    // Fetch scheduled unlocks
    const { data: scheduleData } = await supabase
      .from('scheduled_unlocks')
      .select('*')
      .eq('vault_id', id)
      .eq('enabled', true)

    const scheduledUnlocks = scheduleData || []
    setSchedules(scheduledUnlocks)

    // Check if within scheduled unlock window
    if (isWithinScheduledUnlock(scheduledUnlocks)) {
      setIsScheduledUnlock(true)
      setStep('scheduled')
      setLoading(false)
      return
    }

    // Fetch active emergency access request
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
      // Move to next passage or master password
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

      // Mark emergency request as completed if used
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <div className="text-slate-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-2xl pt-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-xl shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {step === 'checking' && 'Checking Access...'}
              {step === 'scheduled' && 'Scheduled Unlock'}
              {step === 'emergency-pending' && 'Emergency Access Pending'}
              {step === 'typing' && `Typing Challenge (${currentPassageIndex + 1}/${totalPassages})`}
              {step === 'master' && 'Enter Master Password'}
              {step === 'reveal' && 'Password Retrieved'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 'scheduled' && 'You are within a scheduled unlock window'}
              {step === 'emergency-pending' && `Emergency access will be available in ${emergencyCountdown}`}
              {step === 'typing' && `Retrieving: ${vault?.name}`}
              {step === 'master' && 'Enter your master password to decrypt'}
              {step === 'reveal' && vault?.name}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Scheduled Unlock - Skip Challenge */}
            {step === 'scheduled' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                    <span className="font-medium text-emerald-400">Scheduled Unlock Active</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    You're within a scheduled unlock window. No typing challenge required.
                  </p>
                </div>
                <Button 
                  onClick={() => setStep('master')}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                >
                  Continue to Unlock
                </Button>
              </div>
            )}

            {/* Emergency Access Pending */}
            {step === 'emergency-pending' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-amber-400" />
                    <span className="font-medium text-amber-400">Emergency Access Requested</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    Your password will be available in:
                  </p>
                  <p className="text-3xl font-bold text-white text-center">
                    {emergencyCountdown}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleCancelEmergency}
                    className="flex-1 border-slate-700 bg-slate-800/30 text-slate-300 hover:bg-slate-800/50"
                  >
                    Cancel & Type Instead
                  </Button>
                </div>
                <p className="text-center text-xs text-slate-500">
                  The delay helps prevent impulsive access
                </p>
              </div>
            )}

            {/* Typing Challenge */}
            {step === 'typing' && (
              <div className="space-y-6">
                {/* Emergency Access Option */}
                <div className="rounded-lg bg-slate-800/30 border border-slate-700/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <span className="text-sm text-slate-400">Need emergency access?</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRequestEmergencyAccess}
                      disabled={requestingEmergency}
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    >
                      {requestingEmergency ? 'Requesting...' : `Request (${EMERGENCY_DELAY_HOURS}h wait)`}
                    </Button>
                  </div>
                </div>

                {/* Overall Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Overall Progress</span>
                    <span className="text-emerald-400">{overallProgress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/50">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Passage display */}
                <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-4 font-mono text-sm leading-relaxed">
                  <span className="text-emerald-400">{typedText}</span>
                  <span className="animate-pulse text-emerald-400">|</span>
                  <span className="text-slate-500">{currentPassage.slice(typedText.length)}</span>
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <Input
                    ref={inputRef}
                    value={typedText}
                    onChange={handleTypingChange}
                    placeholder="Start typing the passage above..."
                    className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
                    autoFocus
                  />
                  {errors > 0 && (
                    <p className="text-sm text-amber-400">
                      {errors} error{errors !== 1 ? 's' : ''} — type carefully!
                    </p>
                  )}
                </div>

                <p className="text-center text-sm text-slate-500">
                  Complete all {totalPassages} passages to continue
                </p>
              </div>
            )}

            {/* Master Password */}
            {step === 'master' && (
              <form onSubmit={handleMasterSubmit} className="space-y-4">
                {isScheduledUnlock && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
                    Scheduled unlock — challenge skipped
                  </div>
                )}
                {emergencyRequest && isEmergencyAccessReady(emergencyRequest) && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-400">
                    Emergency access granted
                  </div>
                )}
                {decryptError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                    {decryptError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="master" className="text-slate-300">Master Password</Label>
                  <div className="relative">
                    <Input
                      id="master"
                      type={showMaster ? 'text' : 'password'}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 pr-10 focus:border-emerald-500/50"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowMaster(!showMaster)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showMaster ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                  disabled={decrypting || !masterPassword}
                >
                  {decrypting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Decrypting...
                    </>
                  ) : (
                    'Decrypt Password'
                  )}
                </Button>
              </form>
            )}

            {/* Reveal Password */}
            {step === 'reveal' && (
              <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6 text-center">
                  <p className="mb-2 text-sm text-slate-400">Your password is:</p>
                  <div className="flex items-center justify-center gap-4">
                    <span className="font-mono text-3xl tracking-widest text-white">
                      {showPassword ? revealedPassword : '••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="flex-1 border-slate-700 bg-slate-800/30 text-slate-300 hover:bg-slate-800/50"
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
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                      Done
                    </Button>
                  </Link>
                </div>

                <p className="text-center text-sm text-slate-500">
                  This password will be hidden when you leave this page
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
