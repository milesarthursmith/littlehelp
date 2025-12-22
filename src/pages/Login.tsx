import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Leaf } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#faf8f5] relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="deco-circle w-[500px] h-[500px] -top-48 -right-48 animate-breathe" />
      <div className="deco-circle w-[400px] h-[400px] -bottom-32 -left-32 animate-breathe" style={{ animationDelay: '2s' }} />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and heading */}
        <div className="mb-10 text-center animate-fade-up">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f4f3] animate-float">
            <Leaf className="h-8 w-8 text-[#2d9d92]" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl text-[#2d3748] mb-2" style={{ fontFamily: 'Newsreader, serif' }}>
            Welcome back
          </h1>
          <p className="text-[#718096]">
            Take a breath. Your vault is secure.
          </p>
        </div>

        <Card className="border-[#e2ddd5] bg-white card-shadow animate-fade-up delay-1">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 animate-fade-in">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#4a5568] font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-11 border-[#e2ddd5] bg-[#faf8f5] text-[#2d3748] placeholder:text-[#a0aec0] focus:border-[#2d9d92] focus:ring-2 focus:ring-[#2d9d92]/10 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#4a5568] font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 border-[#e2ddd5] bg-[#faf8f5] text-[#2d3748] placeholder:text-[#a0aec0] focus:border-[#2d9d92] focus:ring-2 focus:ring-[#2d9d92]/10 transition-all font-mono"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-5 pt-2 pb-6">
              <Button 
                type="submit" 
                className="w-full h-11 bg-[#2d9d92] hover:bg-[#237a72] text-white font-medium transition-all duration-200 hover:shadow-md hover:shadow-[#2d9d92]/20 rounded-lg"
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
              
              <p className="text-[#718096] text-center">
                New here?{' '}
                <Link 
                  to="/signup" 
                  className="text-[#2d9d92] hover:text-[#237a72] font-medium transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
        
        {/* Footer */}
        <p className="mt-8 text-center text-sm text-[#a0aec0] animate-fade-up delay-3">
          Your passwords are encrypted before they leave your device
        </p>
      </div>
    </div>
  )
}
