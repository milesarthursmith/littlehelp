import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7F6]">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-up">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#338089]">
            <Shield className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-[24px] font-bold text-[#2C3E50] mb-2">Welcome back</h1>
          <p className="text-[14px] text-[#7F8C8D]">Sign in to your password vault</p>
        </div>

        {/* Card */}
        <Card className="border-[#E5E8E8] bg-white rounded-[12px] card-shadow animate-fade-up delay-1">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-6 px-6">
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
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
              
              <p className="text-[14px] text-[#7F8C8D] text-center">
                Don't have an account?{' '}
                <Link to="/signup" className="text-[#338089] font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
