import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase, type PasswordVault } from '@/lib/supabase'
import { decryptPassword } from '@/lib/encryption'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Lock, Copy, Check, Eye, EyeOff } from 'lucide-react'

// Long passage for typing challenge
const TYPING_PASSAGE = `The path to self-discipline begins with small, consistent choices. Each time you resist an impulse, you strengthen your ability to focus on what truly matters. This moment of friction is not a barrier—it is a gift. By taking the time to complete this challenge, you are proving to yourself that you have the patience and determination to overcome distraction. Remember why you set these boundaries in the first place. Your future self will thank you for the discipline you show today. Keep typing, stay focused, and trust the process.`

export default function RetrievePassword() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vault, setVault] = useState<PasswordVault | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'typing' | 'master' | 'reveal'>('typing')
  
  // Typing challenge state
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

  useEffect(() => {
    fetchVault()
  }, [id])

  const fetchVault = async () => {
    if (!id) return

    const { data, error } = await supabase
      .from('password_vaults')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching vault:', error)
      navigate('/dashboard')
    } else {
      setVault(data)
    }
    setLoading(false)
  }

  const handleTypingChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const targetChar = TYPING_PASSAGE[value.length - 1]
    const typedChar = value[value.length - 1]

    if (typedChar !== targetChar && value.length > typedText.length) {
      setErrors(prev => prev + 1)
      // Don't update the text if it's wrong
      return
    }

    setTypedText(value)

    if (value === TYPING_PASSAGE) {
      setStep('master')
    }
  }, [typedText.length])

  const progress = Math.round((typedText.length / TYPING_PASSAGE.length) * 100)

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="mx-auto max-w-2xl pt-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center text-slate-400 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <Lock className="h-6 w-6 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl text-white">
              {step === 'typing' && 'Typing Challenge'}
              {step === 'master' && 'Enter Master Password'}
              {step === 'reveal' && 'Password Retrieved'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 'typing' && `Retrieving: ${vault?.name}`}
              {step === 'master' && 'Enter your master password to decrypt'}
              {step === 'reveal' && vault?.name}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'typing' && (
              <div className="space-y-6">
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-emerald-400">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Passage display */}
                <div className="rounded-lg bg-slate-900/50 p-4 font-mono text-sm leading-relaxed">
                  <span className="text-emerald-400">{typedText}</span>
                  <span className="animate-pulse text-emerald-400">|</span>
                  <span className="text-slate-500">{TYPING_PASSAGE.slice(typedText.length)}</span>
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <Input
                    ref={inputRef}
                    value={typedText}
                    onChange={handleTypingChange}
                    placeholder="Start typing the passage above..."
                    className="border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500"
                    autoFocus
                  />
                  {errors > 0 && (
                    <p className="text-sm text-amber-400">
                      {errors} error{errors !== 1 ? 's' : ''} — type carefully!
                    </p>
                  )}
                </div>

                <p className="text-center text-sm text-slate-500">
                  Type the entire passage exactly to continue
                </p>
              </div>
            )}

            {step === 'master' && (
              <form onSubmit={handleMasterSubmit} className="space-y-4">
                {decryptError && (
                  <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
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
                      className="border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowMaster(!showMaster)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showMaster ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={decrypting || !masterPassword}
                >
                  {decrypting ? 'Decrypting...' : 'Decrypt Password'}
                </Button>
              </form>
            )}

            {step === 'reveal' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-slate-900/50 p-6 text-center">
                  <p className="mb-2 text-sm text-slate-400">Your password is:</p>
                  <div className="flex items-center justify-center gap-4">
                    <span className="font-mono text-3xl tracking-widest text-white">
                      {showPassword ? revealedPassword : '••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
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
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
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

