import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { encryptPassword } from '@/lib/encryption'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Lock, Eye, EyeOff, Smartphone, Delete, RotateCcw } from 'lucide-react'

type Instruction = {
  type: 'digit' | 'delete' | 'wait' | 'distraction'
  value?: string
  message: string
}

// Generate a random 4-digit PIN
function generatePin(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('')
}

// Generate confusing instruction sequence for entering a PIN
// This creates a complex sequence: enter some digits, delete some, add more, etc.
function generateInstructions(pin: string): Instruction[] {
  const instructions: Instruction[] = []
  const digits = pin.split('')
  
  // Distractions to break memory
  const distractions = [
    { type: 'distraction' as const, message: 'Look away from your phone for a moment...' },
    { type: 'distraction' as const, message: 'Take a deep breath...' },
    { type: 'distraction' as const, message: 'Think about what you had for breakfast...' },
    { type: 'wait' as const, message: 'Wait 3 seconds before continuing...' },
  ]
  
  // Track what should be in the field at each step
  let fieldState: string[] = []
  let nextDigitIndex = 0
  
  // Phase 1: Enter 2-3 digits (can include fake ones)
  const initialDigits = Math.random() < 0.5 ? 2 : 3
  
  for (let i = 0; i < initialDigits && nextDigitIndex < 4; i++) {
    // Sometimes add a fake digit first
    if (Math.random() < 0.4 && fieldState.length < 3) {
      const fakeDigit = String(Math.floor(Math.random() * 10))
      instructions.push({
        type: 'digit',
        value: fakeDigit,
        message: `Enter ${fakeDigit} into your iPhone`
      })
      fieldState.push(fakeDigit)
    }
    
    // Add real digit
    instructions.push({
      type: 'digit',
      value: digits[nextDigitIndex],
      message: `Enter ${digits[nextDigitIndex]} into your iPhone`
    })
    fieldState.push(digits[nextDigitIndex])
    nextDigitIndex++
  }
  
  // Distraction
  if (nextDigitIndex < 4 && Math.random() < 0.7) {
    instructions.push(distractions[Math.floor(Math.random() * distractions.length)])
  }
  
  // Phase 2: Delete some digits (but not all - keep at least the first real digit)
  if (fieldState.length > 1 && nextDigitIndex < 4) {
    // Find how many real digits we have
    let realDigitCount = 0
    for (let i = 0; i < fieldState.length && i < nextDigitIndex; i++) {
      if (fieldState[i] === digits[i]) {
        realDigitCount++
      }
    }
    
    // Delete some, but keep at least 1 real digit
    const deleteCount = Math.min(
      Math.floor(Math.random() * (fieldState.length - 1)) + 1,
      fieldState.length - 1 // Always keep at least 1
    )
    
    for (let i = 0; i < deleteCount; i++) {
      instructions.push({
        type: 'delete',
        message: 'Press the Delete key on your iPhone'
      })
      const removed = fieldState.pop()
      // If we removed a real digit that was in correct position, adjust nextDigitIndex
      if (removed && fieldState.length < nextDigitIndex) {
        nextDigitIndex = fieldState.length
      }
    }
    
    // Distraction after deleting
    if (nextDigitIndex < 4 && Math.random() < 0.6) {
      instructions.push(distractions[Math.floor(Math.random() * distractions.length)])
    }
  }
  
  // Phase 3: Add remaining digits to complete the PIN
  while (nextDigitIndex < 4) {
    // Sometimes add and immediately delete a fake digit
    if (Math.random() < 0.3 && fieldState.length < 3) {
      const fakeDigit = String(Math.floor(Math.random() * 10))
      instructions.push({
        type: 'digit',
        value: fakeDigit,
        message: `Enter ${fakeDigit} into your iPhone`
      })
      fieldState.push(fakeDigit)
      
      instructions.push({
        type: 'delete',
        message: 'Press the Delete key on your iPhone'
      })
      fieldState.pop()
    }
    
    // Add the next real digit
    instructions.push({
      type: 'digit',
      value: digits[nextDigitIndex],
      message: `Enter ${digits[nextDigitIndex]} into your iPhone`
    })
    fieldState.push(digits[nextDigitIndex])
    nextDigitIndex++
    
    // Distraction between digits (not after last)
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

  // Handle wait countdown
  useEffect(() => {
    if (waitCountdown > 0) {
      const timer = setTimeout(() => setWaitCountdown(waitCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [waitCountdown])

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a name')
      return
    }
    setError('')
    
    // Generate PIN and instructions
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
    
    // If it's a wait instruction, start countdown
    if (current.type === 'wait') {
      setWaitCountdown(3)
      setTimeout(() => {
        if (currentInstruction < currentInstructions.length - 1) {
          setCurrentInstruction(currentInstruction + 1)
        } else if (step === 'instructions') {
          // Move to verify step
          setCurrentInstruction(0)
          setStep('verify')
        } else {
          // Move to master password
          setStep('master')
        }
      }, 3000)
      return
    }
    
    if (currentInstruction < currentInstructions.length - 1) {
      setCurrentInstruction(currentInstruction + 1)
    } else if (step === 'instructions') {
      // Move to verify step
      setCurrentInstruction(0)
      setStep('verify')
    } else {
      // Move to master password
      setStep('master')
    }
  }

  const handleMasterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (masterPassword.length < 6) {
      setError('Master password must be at least 6 characters')
      return
    }
    setError('')
    setStep('confirm')
  }

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (masterPassword !== confirmMaster) {
      setError('Master passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const encrypted = await encryptPassword(generatedPin, masterPassword)

      const { error: dbError } = await supabase
        .from('password_vaults')
        .insert({
          user_id: user?.id,
          name,
          encrypted_password: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
        })

      if (dbError) throw dbError

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store password')
      setLoading(false)
    }
  }

  const handleReset = () => {
    const pin = generatePin()
    setGeneratedPin(pin)
    setInstructions(generateInstructions(pin))
    setVerifyInstructions(generateInstructions(pin))
    setCurrentInstruction(0)
  }

  const currentInstructions = step === 'instructions' ? instructions : verifyInstructions
  const progress = currentInstructions.length > 0 
    ? Math.round(((currentInstruction + 1) / currentInstructions.length) * 100) 
    : 0

  const getInstructionIcon = (type: Instruction['type']) => {
    switch (type) {
      case 'digit': return <Smartphone className="h-8 w-8" />
      case 'delete': return <Delete className="h-8 w-8" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-md pt-8">
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
              {step === 'name' && 'Create New Password'}
              {step === 'instructions' && 'Enter PIN into iPhone'}
              {step === 'verify' && 'Verify PIN (Enter Again)'}
              {step === 'master' && 'Set Master Password'}
              {step === 'confirm' && 'Confirm Master Password'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 'name' && 'Give this password a memorable name'}
              {step === 'instructions' && 'Follow each instruction carefully on your iPhone'}
              {step === 'verify' && 'iPhone will ask you to verify - follow along again'}
              {step === 'master' && 'This unlocks your password during retrieval'}
              {step === 'confirm' && 'Type your master password again'}
            </CardDescription>
          </CardHeader>

          {step === 'name' && (
            <form onSubmit={handleNameSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Password Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., iOS Screen Time"
                    className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                  Generate PIN & Start
                </Button>
              </CardContent>
            </form>
          )}

          {(step === 'instructions' || step === 'verify') && currentInstructions.length > 0 && (
            <CardContent className="space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    {step === 'instructions' ? 'First entry' : 'Verification'}
                  </span>
                  <span className="text-emerald-400">{progress}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/50">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 shadow-lg shadow-emerald-500/25"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Current instruction */}
              <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-8 text-center backdrop-blur-sm">
                <div className="mb-6 flex justify-center text-emerald-400">
                  {getInstructionIcon(currentInstructions[currentInstruction].type)}
                </div>
                <p className="text-xl font-semibold text-white mb-4">
                  {currentInstructions[currentInstruction].message}
                </p>
                {currentInstructions[currentInstruction].type === 'digit' && (
                  <div className="mt-6 inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <p className="font-mono text-6xl font-bold text-emerald-400">
                      {currentInstructions[currentInstruction].value}
                    </p>
                  </div>
                )}
                {waitCountdown > 0 && (
                  <div className="mt-6 inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                    <p className="text-5xl font-bold text-amber-400">
                      {waitCountdown}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="border-slate-700 bg-slate-800/30 text-slate-300 hover:bg-slate-800/50 hover:text-white backdrop-blur-sm"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button 
                  onClick={handleNextInstruction}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                  disabled={waitCountdown > 0}
                >
                  {currentInstruction < currentInstructions.length - 1 ? 'Next' : 
                   step === 'instructions' ? 'Start Verification' : 'Continue'}
                </Button>
              </div>

              <p className="text-center text-xs text-slate-500">
                Do NOT try to remember the digits. Just follow each instruction.
              </p>
            </CardContent>
          )}

          {step === 'master' && (
            <form onSubmit={handleMasterSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                    {error}
                  </div>
                )}
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
                  Your PIN has been generated and entered into your iPhone!
                </div>
                <div className="space-y-2">
                  <Label htmlFor="master" className="text-slate-300">Master Password</Label>
                  <div className="relative">
                    <Input
                      id="master"
                      type={showPassword ? 'text' : 'password'}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 pr-10 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    You'll need this to retrieve your PIN later
                  </p>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                  Continue
                </Button>
              </CardContent>
            </form>
          )}

          {step === 'confirm' && (
            <form onSubmit={handleConfirmSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-slate-300">Confirm Master Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirmMaster}
                    onChange={(e) => setConfirmMaster(e.target.value)}
                    placeholder="••••••••"
                    className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                  disabled={loading}
                >
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
