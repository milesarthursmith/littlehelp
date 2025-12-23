import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, CheckCircle2 } from 'lucide-react'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7F6]">
        <Card className="w-full max-w-[400px] border-[#E5E8E8] bg-white rounded-[12px] card-shadow animate-fade-up">
          <CardHeader className="text-center pt-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#338089]/10">
              <CheckCircle2 className="h-7 w-7 text-[#338089]" />
            </div>
            <CardTitle className="text-[18px] font-bold text-[#2C3E50]">Check your email</CardTitle>
            <CardDescription className="text-[14px] text-[#7F8C8D]">
              We've sent you a confirmation link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7F6]">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-up">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#338089]">
            <Shield className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-[24px] font-bold text-[#2C3E50] mb-2">Create account</h1>
          <p className="text-[14px] text-[#7F8C8D]">Get started with Password Locker</p>
        </div>

        {/* Card */}
        <Card className="border-[#E5E8E8] bg-white rounded-[12px] card-shadow animate-fade-up delay-1">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6 px-6">
              {error && (
                <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[14px] text-red-600 animate-fade-in">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[14px] font-medium text-[#2C3E50]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-11 rounded-[8px] border-[#E5E8E8] bg-white text-[#2C3E50] placeholder:text-[#95A5A6] focus:border-[#338089] focus:ring-2 focus:ring-[#338089]/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[14px] font-medium text-[#2C3E50]">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 rounded-[8px] border-[#E5E8E8] bg-white text-[#2C3E50] placeholder:text-[#95A5A6] focus:border-[#338089] focus:ring-2 focus:ring-[#338089]/20"
                />
                <p className="text-[12px] text-[#95A5A6]">At least 6 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[14px] font-medium text-[#2C3E50]">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 rounded-[8px] border-[#E5E8E8] bg-white text-[#2C3E50] placeholder:text-[#95A5A6] focus:border-[#338089] focus:ring-2 focus:ring-[#338089]/20"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 pt-2 pb-6 px-6">
              <Button 
                type="submit" 
                className="w-full h-11 rounded-[8px] bg-[#EF7E5B] hover:bg-[#D16A4A] text-white text-[14px] font-semibold transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating account...
                  </span>
                ) : (
                  'Sign Up'
                )}
              </Button>
              
              <p className="text-[14px] text-[#7F8C8D] text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-[#338089] font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
