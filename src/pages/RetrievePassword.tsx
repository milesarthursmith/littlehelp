import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase, type PasswordVault, type ScheduledUnlock, type EmergencyAccessRequest, isWithinScheduledUnlock, isEmergencyAccessReady } from '@/lib/supabase'
import { decryptPassword } from '@/lib/encryption'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Shield, Copy, Check, Eye, EyeOff, Clock, AlertTriangle, Calendar, Heart } from 'lucide-react'

const TYPING_PASSAGES = [
  `The path to self-discipline begins with small, consistent choices. Each time you resist an impulse, you strengthen your ability to focus on what truly matters. This moment of friction is not a barrier—it is a gift. By taking the time to complete this challenge, you are proving to yourself that you have the patience and determination to overcome distraction.`,
  `Discipline is choosing between what you want now and what you want most. The temporary pleasure of distraction fades quickly, but the satisfaction of staying focused compounds over time. Every keystroke here is a small victory, a proof that you can delay gratification when it matters. The urge that brought you here will pass, as all urges do.`,
  `Success is not about having more willpower than others. It is about designing your environment and habits so that the right choice becomes the easy choice. That is exactly what you are doing right now. By creating friction between yourself and distraction, you are making focus the path of least resistance.`,
]

const EMERGENCY_DELAY_HOURS = 24
const EVERY_ORG_DONATE_URL = 'https://www.every.org/donate'

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

  useEffect(() => { fetchData() }, [id])

  useEffect(() => {
    if (!emergencyRequest || emergencyRequest.cancelled) return
    const updateCountdown = () => {
      const unlockTime = new Date(emergencyRequest.unlock_at)
      const now = new Date()
      const diff = unlockTime.getTime() - now.getTime()
      if (diff <= 0) { setEmergencyCountdown('Ready!'); setStep('master'); return }
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
    const { data: vaultData, error: vaultError } = await supabase.from('password_vaults').select('*').eq('id', id).single()
    if (vaultError) { navigate('/dashboard'); return }
    setVault(vaultData)

    const { data: scheduleData } = await supabase.from('scheduled_unlocks').select('*').eq('vault_id', id).eq('enabled', true)
    const scheduledUnlocks = scheduleData || []
    setSchedules(scheduledUnlocks)

    if (isWithinScheduledUnlock(scheduledUnlocks)) { setIsScheduledUnlock(true); setStep('scheduled'); setLoading(false); return }

    const { data: emergencyData } = await supabase.from('emergency_access_requests').select('*').eq('vault_id', id).eq('cancelled', false).is('completed_at', null).order('created_at', { ascending: false }).limit(1).single()
    if (emergencyData) {
      setEmergencyRequest(emergencyData)
      setStep(isEmergencyAccessReady(emergencyData) ? 'master' : 'emergency-pending')
    } else { setStep('typing') }
    setLoading(false)
  }

  const handleRequestEmergencyAccess = async () => {
    if (!vault) return
    setRequestingEmergency(true)
    const unlockAt = new Date()
    unlockAt.setHours(unlockAt.getHours() + EMERGENCY_DELAY_HOURS)
    const { data, error } = await supabase.from('emergency_access_requests').insert({ vault_id: vault.id, user_id: vault.user_id, unlock_at: unlockAt.toISOString() }).select().single()
    if (error) {
      if (error.code === '42P01') alert('Database table not found. Please run the latest supabase-schema.sql.')
      else alert(`Failed: ${error.message}`)
    } else { setEmergencyRequest(data); setStep('emergency-pending') }
    setRequestingEmergency(false)
  }

  const handleCancelEmergency = async () => {
    if (!emergencyRequest) return
    await supabase.from('emergency_access_requests').update({ cancelled: true }).eq('id', emergencyRequest.id)
    setEmergencyRequest(null)
    setStep('typing')
  }

  const handleDonateToSkip = () => {
    // Open Every.org donation page
    // After donation, user would receive a skip code or we'd verify via webhook
    window.open(EVERY_ORG_DONATE_URL, '_blank')
  }

  const handleTypingChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const targetChar = currentPassage[value.length - 1]
    const typedChar = value[value.length - 1]
    if (typedChar !== targetChar && value.length > typedText.length) { setErrors(prev => prev + 1); return }
    setTypedText(value)
    if (value === currentPassage) {
      if (currentPassageIndex < totalPassages - 1) { setCurrentPassageIndex(currentPassageIndex + 1); setTypedText('') }
      else { setStep('master') }
    }
  }, [typedText.length, currentPassage, currentPassageIndex, totalPassages])

  const overallProgress = Math.round(((currentPassageIndex * 100) + (typedText.length / currentPassage.length * 100)) / totalPassages)

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vault) return
    setDecrypting(true); setDecryptError('')
    try {
      const decrypted = await decryptPassword({ ciphertext: vault.encrypted_password, iv: vault.iv, salt: vault.salt }, masterPassword)
      setRevealedPassword(decrypted); setStep('reveal')
      if (emergencyRequest) await supabase.from('emergency_access_requests').update({ completed_at: new Date().toISOString() }).eq('id', emergencyRequest.id)
    } catch { setDecryptError('Invalid master password.') }
    setDecrypting(false)
  }

  const handleCopy = () => { navigator.clipboard.writeText(revealedPassword); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#338089] border-t-transparent" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F7F6] p-6">
      <div className="max-w-[540px] mx-auto pt-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[14px] text-[#7F8C8D] hover:text-[#2C3E50] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <Card className="border-[#E5E8E8] bg-white rounded-[12px] card-shadow animate-fade-up">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#338089]">
              <Shield className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-[18px] font-bold text-[#2C3E50]">
              {step === 'scheduled' && 'Scheduled Unlock'}
              {step === 'emergency-pending' && 'Emergency Access'}
              {step === 'typing' && `Typing Challenge (${currentPassageIndex + 1}/${totalPassages})`}
              {step === 'master' && 'Enter Password'}
              {step === 'reveal' && 'Password Retrieved'}
            </CardTitle>
            <CardDescription className="text-[14px] text-[#7F8C8D]">
              {step === 'scheduled' && 'Challenge skipped during scheduled window'}
              {step === 'emergency-pending' && `Available in ${emergencyCountdown}`}
              {step === 'typing' && vault?.name}
              {step === 'master' && 'Decrypt with your master password'}
              {step === 'reveal' && vault?.name}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {step === 'scheduled' && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-[8px] bg-[#338089]/10 border border-[#338089]/20 p-4 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[#338089]" />
                  <span className="text-[14px] text-[#338089] font-medium">Scheduled unlock active</span>
                </div>
                <Button onClick={() => setStep('master')} className="w-full h-10 rounded-[8px] bg-[#338089] hover:bg-[#266067] text-white text-[14px] font-semibold">
                  Continue
                </Button>
              </div>
            )}

            {step === 'emergency-pending' && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-[8px] bg-amber-50 border border-amber-200 p-4 text-center">
                  <Clock className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-[24px] font-bold text-[#2C3E50] font-mono">{emergencyCountdown}</p>
                  <p className="text-[12px] text-[#7F8C8D] mt-1">Time remaining</p>
                </div>
                <Button variant="outline" onClick={handleCancelEmergency} className="w-full h-10 rounded-[8px] border-[#E5E8E8] text-[#7F8C8D]">
                  Cancel & Type Instead
                </Button>
              </div>
            )}

            {step === 'typing' && (
              <div className="space-y-5 animate-fade-in">
                {/* Skip options */}
                <div className="rounded-[8px] bg-[#F4F7F6] border border-[#E5E8E8] p-4 space-y-3">
                  <p className="text-[12px] text-[#7F8C8D] text-center font-medium">Skip the challenge</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDonateToSkip}
                      className="flex-1 h-9 rounded-[8px] border-[#E5E8E8] text-[#7F8C8D] hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200"
                    >
                      <Heart className="h-3.5 w-3.5 mr-1.5" />
                      Donate $5
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRequestEmergencyAccess} 
                      disabled={requestingEmergency}
                      className="flex-1 h-9 rounded-[8px] border-[#E5E8E8] text-[#7F8C8D] hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      {requestingEmergency ? 'Requesting...' : `Wait ${EMERGENCY_DELAY_HOURS}h`}
                    </Button>
                  </div>
                  <p className="text-[10px] text-[#95A5A6] text-center">
                    Donate to charity or request emergency access
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7F8C8D]">Progress</span>
                    <span className="text-[#338089] font-medium">{overallProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E5E8E8] overflow-hidden">
                    <div className="h-full bg-[#338089] transition-all duration-300" style={{ width: `${overallProgress}%` }} />
                  </div>
                </div>

                <div className="rounded-[8px] bg-[#F4F7F6] border border-[#E5E8E8] p-4 text-[14px] leading-relaxed">
                  <span className="text-[#338089]">{typedText}</span>
                  <span className="animate-pulse text-[#338089]">|</span>
                  <span className="text-[#95A5A6]">{currentPassage.slice(typedText.length)}</span>
                </div>

                <div className="space-y-2">
                  <Input
                    ref={inputRef}
                    value={typedText}
                    onChange={handleTypingChange}
                    placeholder="Start typing..."
                    autoFocus
                    className="h-11 rounded-[8px] border-[#E5E8E8] bg-white text-[#2C3E50] focus:border-[#338089]"
                  />
                  {errors > 0 && <p className="text-[12px] text-amber-600">{errors} error{errors !== 1 ? 's' : ''}</p>}
                </div>
              </div>
            )}

            {step === 'master' && (
              <form onSubmit={handleMasterSubmit} className="space-y-4 animate-fade-in">
                {isScheduledUnlock && (
                  <div className="rounded-[8px] bg-[#338089]/10 border border-[#338089]/20 p-3 text-[12px] text-[#338089]">✓ Scheduled unlock</div>
                )}
                {emergencyRequest && isEmergencyAccessReady(emergencyRequest) && (
                  <div className="rounded-[8px] bg-amber-50 border border-amber-200 p-3 text-[12px] text-amber-700">✓ Emergency access granted</div>
                )}
                {decryptError && (
                  <div className="rounded-[8px] bg-red-50 border border-red-200 p-3 text-[14px] text-red-600">{decryptError}</div>
                )}
                <div className="space-y-2">
                  <Label className="text-[14px] font-medium text-[#2C3E50]">Master Password</Label>
                  <div className="relative">
                    <Input
                      id="master"
                      type={showMaster ? 'text' : 'password'}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="••••••••"
                      autoFocus
                      className="h-11 rounded-[8px] border-[#E5E8E8] bg-white pr-10 focus:border-[#338089]"
                    />
                    <button type="button" onClick={() => setShowMaster(!showMaster)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#95A5A6] hover:text-[#7F8C8D]">
                      {showMaster ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={decrypting || !masterPassword} className="w-full h-10 rounded-[8px] bg-[#EF7E5B] hover:bg-[#D16A4A] text-white text-[14px] font-semibold">
                  {decrypting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />Decrypting...</> : 'Unlock'}
                </Button>
              </form>
            )}

            {step === 'reveal' && (
              <div className="space-y-5 animate-fade-in">
                <div className="rounded-[8px] bg-[#F4F7F6] border border-[#E5E8E8] p-5 text-center">
                  <p className="text-[12px] text-[#7F8C8D] mb-2">Your password</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-[24px] font-mono font-semibold text-[#2C3E50] tracking-wide">
                      {showPassword ? revealedPassword : '••••'}
                    </span>
                    <button onClick={() => setShowPassword(!showPassword)} className="text-[#95A5A6] hover:text-[#7F8C8D]">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCopy} className="flex-1 h-10 rounded-[8px] border-[#E5E8E8] text-[#7F8C8D]">
                    {copied ? <><Check className="h-4 w-4 mr-2" />Copied</> : <><Copy className="h-4 w-4 mr-2" />Copy</>}
                  </Button>
                  <Link to="/dashboard" className="flex-1">
                    <Button className="w-full h-10 rounded-[8px] bg-[#338089] hover:bg-[#266067] text-white text-[14px] font-semibold">Done</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
