import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { encryptPassword } from '@/lib/encryption'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Shield, Eye, EyeOff, Smartphone, Delete, RotateCcw } from 'lucide-react'

type Instruction = {
  type: 'digit' | 'delete' | 'wait' | 'distraction'
  value?: string
  message: string
}

function generatePin(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('')
}

function generateInstructions(pin: string): Instruction[] {
  const instructions: Instruction[] = []
  const digits = pin.split('')
  const distractions = [
    { type: 'distraction' as const, message: 'Look away from your phone...' },
    { type: 'distraction' as const, message: 'Take a deep breath...' },
    { type: 'wait' as const, message: 'Wait 3 seconds...' },
  ]
  
  let fieldState: string[] = []
  let nextDigitIndex = 0
  const initialDigits = Math.random() < 0.5 ? 2 : 3
  
  for (let i = 0; i < initialDigits && nextDigitIndex < 4; i++) {
    if (Math.random() < 0.4 && fieldState.length < 3) {
      const fakeDigit = String(Math.floor(Math.random() * 10))
      instructions.push({ type: 'digit', value: fakeDigit, message: `Enter ${fakeDigit}` })
      fieldState.push(fakeDigit)
    }
    instructions.push({ type: 'digit', value: digits[nextDigitIndex], message: `Enter ${digits[nextDigitIndex]}` })
    fieldState.push(digits[nextDigitIndex])
    nextDigitIndex++
  }
  
  if (nextDigitIndex < 4 && Math.random() < 0.7) {
    instructions.push(distractions[Math.floor(Math.random() * distractions.length)])
  }
  
  if (fieldState.length > 1 && nextDigitIndex < 4) {
    const deleteCount = Math.min(Math.floor(Math.random() * (fieldState.length - 1)) + 1, fieldState.length - 1)
    for (let i = 0; i < deleteCount; i++) {
      instructions.push({ type: 'delete', message: 'Press Delete' })
      const removed = fieldState.pop()
      if (removed && fieldState.length < nextDigitIndex) nextDigitIndex = fieldState.length
    }
    if (nextDigitIndex < 4 && Math.random() < 0.6) {
      instructions.push(distractions[Math.floor(Math.random() * distractions.length)])
    }
  }
  
  while (nextDigitIndex < 4) {
    if (Math.random() < 0.3 && fieldState.length < 3) {
      const fakeDigit = String(Math.floor(Math.random() * 10))
      instructions.push({ type: 'digit', value: fakeDigit, message: `Enter ${fakeDigit}` })
      fieldState.push(fakeDigit)
      instructions.push({ type: 'delete', message: 'Press Delete' })
      fieldState.pop()
    }
    instructions.push({ type: 'digit', value: digits[nextDigitIndex], message: `Enter ${digits[nextDigitIndex]}` })
    fieldState.push(digits[nextDigitIndex])
    nextDigitIndex++
    if (nextDigitIndex < 4 && Math.random() < 0.4) {
      instructions.push(distractions[Math.floor(Math.random() * distractions.length)])
    }
  }
  return instructions
}

export default function StorePassword() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'name' | 'instructions' | 'verify' | 'master' | 'confirm'>('name')
  const [name, setName] = useState('')
  const [generatedPin, setGeneratedPin] = useState('')
  const [instructions, setInstructions] = useState<Instruction[]>([])
  const [verifyInstructions, setVerifyInstructions] = useState<Instruction[]>([])
  const [currentInstruction, setCurrentInstruction] = useState(0)
  const [masterPassword, setMasterPassword] = useState('')
  const [confirmMaster, setConfirmMaster] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [waitCountdown, setWaitCountdown] = useState(0)

  useEffect(() => {
    if (waitCountdown > 0) {
      const timer = setTimeout(() => setWaitCountdown(waitCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [waitCountdown])

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter a name'); return }
    setError('')
    const pin = generatePin()
    setGeneratedPin(pin)
    setInstructions(generateInstructions(pin))
    setVerifyInstructions(generateInstructions(pin))
    setCurrentInstruction(0)
    setStep('instructions')
  }

  const handleNextInstruction = () => {
    const currentInstructions = step === 'instructions' ? instructions : verifyInstructions
    const current = currentInstructions[currentInstruction]
    
    if (current.type === 'wait') {
      setWaitCountdown(3)
      setTimeout(() => {
        if (currentInstruction < currentInstructions.length - 1) setCurrentInstruction(currentInstruction + 1)
        else if (step === 'instructions') { setCurrentInstruction(0); setStep('verify') }
        else setStep('master')
      }, 3000)
      return
    }
    
    if (currentInstruction < currentInstructions.length - 1) setCurrentInstruction(currentInstruction + 1)
    else if (step === 'instructions') { setCurrentInstruction(0); setStep('verify') }
    else setStep('master')
  }

  const handleMasterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (masterPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setStep('confirm')
  }

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (masterPassword !== confirmMaster) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      const encrypted = await encryptPassword(generatedPin, masterPassword)
      const { error: dbError } = await supabase.from('password_vaults').insert({
        user_id: user?.id, name, encrypted_password: encrypted.ciphertext, iv: encrypted.iv, salt: encrypted.salt,
      })
      if (dbError) throw dbError
      navigate('/dashboard')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to store'); setLoading(false) }
  }

  const handleReset = () => {
    const pin = generatePin()
    setGeneratedPin(pin)
    setInstructions(generateInstructions(pin))
    setVerifyInstructions(generateInstructions(pin))
    setCurrentInstruction(0)
  }

  const currentInstructions = step === 'instructions' ? instructions : verifyInstructions
  const progress = currentInstructions.length > 0 ? Math.round(((currentInstruction + 1) / currentInstructions.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F4F7F6] p-6">
      <div className="mx-auto max-w-[420px] pt-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[14px] text-[#7F8C8D] hover:text-[#2C3E50] mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <Card className="border-[#E5E8E8] bg-white rounded-[12px] card-shadow animate-fade-up">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#338089]">
              <Shield className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-[18px] font-bold text-[#2C3E50]">
              {step === 'name' && 'New Password'}
              {step === 'instructions' && 'Enter PIN'}
              {step === 'verify' && 'Verify PIN'}
              {step === 'master' && 'Master Password'}
              {step === 'confirm' && 'Confirm Password'}
            </CardTitle>
            <CardDescription className="text-[14px] text-[#7F8C8D]">
              {step === 'name' && 'Give this password a name'}
              {step === 'instructions' && 'Follow each step on your iPhone'}
              {step === 'verify' && 'Enter the PIN again to verify'}
              {step === 'master' && 'This unlocks your password later'}
              {step === 'confirm' && 'Type it again to confirm'}
            </CardDescription>
          </CardHeader>

          {step === 'name' && (
            <form onSubmit={handleNameSubmit}>
              <CardContent className="space-y-4 px-6 pb-6">
                {error && <div className="rounded-[8px] bg-red-50 border border-red-200 p-3 text-[14px] text-red-600">{error}</div>}
                <div className="space-y-2">
                  <Label className="text-[14px] font-medium text-[#2C3E50]">Password Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., iOS Screen Time" className="h-11 rounded-[8px] border-[#E5E8E8]" />
                </div>
                <Button type="submit" className="w-full h-10 rounded-[8px] bg-[#EF7E5B] hover:bg-[#D16A4A] text-white font-semibold">
                  Generate PIN & Start
                </Button>
              </CardContent>
            </form>
          )}

          {(step === 'instructions' || step === 'verify') && currentInstructions.length > 0 && (
            <CardContent className="space-y-5 px-6 pb-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#7F8C8D]">{step === 'instructions' ? 'First entry' : 'Verification'}</span>
                  <span className="text-[#338089] font-medium">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#E5E8E8] overflow-hidden">
                  <div className="h-full bg-[#338089] transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="rounded-[12px] bg-[#F4F7F6] border border-[#E5E8E8] p-6 text-center">
                <div className="mb-4 flex justify-center text-[#338089]">
                  {currentInstructions[currentInstruction].type === 'digit' && <Smartphone className="h-8 w-8" />}
                  {currentInstructions[currentInstruction].type === 'delete' && <Delete className="h-8 w-8" />}
                </div>
                <p className="text-[16px] font-semibold text-[#2C3E50] mb-4">
                  {currentInstructions[currentInstruction].message}
                </p>
                {currentInstructions[currentInstruction].type === 'digit' && (
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-xl bg-[#338089]/10 border border-[#338089]/20">
                    <span className="font-mono text-5xl font-bold text-[#338089]">{currentInstructions[currentInstruction].value}</span>
                  </div>
                )}
                {waitCountdown > 0 && (
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-4xl font-bold text-amber-600">{waitCountdown}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleReset} className="border-[#E5E8E8] text-[#7F8C8D]">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button onClick={handleNextInstruction} disabled={waitCountdown > 0} className="flex-1 h-10 rounded-[8px] bg-[#338089] hover:bg-[#266067] text-white font-semibold">
                  {currentInstruction < currentInstructions.length - 1 ? 'Next' : step === 'instructions' ? 'Verify' : 'Continue'}
                </Button>
              </div>
              <p className="text-center text-[12px] text-[#95A5A6]">Don't try to remember the digits</p>
            </CardContent>
          )}

          {step === 'master' && (
            <form onSubmit={handleMasterSubmit}>
              <CardContent className="space-y-4 px-6 pb-6">
                {error && <div className="rounded-[8px] bg-red-50 border border-red-200 p-3 text-[14px] text-red-600">{error}</div>}
                <div className="rounded-[8px] bg-[#338089]/10 border border-[#338089]/20 p-3 text-[12px] text-[#338089]">
                  ✓ PIN generated and entered into iPhone!
                </div>
                <div className="space-y-2">
                  <Label className="text-[14px] font-medium text-[#2C3E50]">Master Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} value={masterPassword} onChange={(e) => setMasterPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-[8px] border-[#E5E8E8] pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#95A5A6]">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-10 rounded-[8px] bg-[#EF7E5B] hover:bg-[#D16A4A] text-white font-semibold">Continue</Button>
              </CardContent>
            </form>
          )}

          {step === 'confirm' && (
            <form onSubmit={handleConfirmSubmit}>
              <CardContent className="space-y-4 px-6 pb-6">
                {error && <div className="rounded-[8px] bg-red-50 border border-red-200 p-3 text-[14px] text-red-600">{error}</div>}
                <div className="space-y-2">
                  <Label className="text-[14px] font-medium text-[#2C3E50]">Confirm Password</Label>
                  <Input type="password" value={confirmMaster} onChange={(e) => setConfirmMaster(e.target.value)} placeholder="••••••••" className="h-11 rounded-[8px] border-[#E5E8E8]" />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-10 rounded-[8px] bg-[#EF7E5B] hover:bg-[#D16A4A] text-white font-semibold">
                  {loading ? 'Storing...' : 'Store Password'}
                </Button>
              </CardContent>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
