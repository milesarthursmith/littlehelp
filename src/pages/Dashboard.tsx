import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase, type PasswordVault } from '@/lib/supabase'
import { decryptPassword } from '@/lib/encryption'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Leaf, Plus, LogOut, Key, Trash2, BookOpen, Eye, EyeOff, Copy, Check, Calendar, Download, Sparkles } from 'lucide-react'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [vaults, setVaults] = useState<PasswordVault[]>([])
  const [loading, setLoading] = useState(true)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchVaults()
  }, [])

  const fetchVaults = async () => {
    const { data, error } = await supabase
      .from('password_vaults')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vaults:', error)
    } else {
      setVaults(data || [])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this password?')) return

    const { error } = await supabase
      .from('password_vaults')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting vault:', error)
    } else {
      setVaults(vaults.filter(v => v.id !== id))
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleTestOverride = async (vault: PasswordVault, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    if (revealedPasswords[vault.id]) {
      const newRevealed = { ...revealedPasswords }
      delete newRevealed[vault.id]
      setRevealedPasswords(newRevealed)
      return
    }

    const masterPassword = prompt('Enter master password (TEST OVERRIDE):')
    if (!masterPassword) return

    try {
      const decrypted = await decryptPassword(
        {
          ciphertext: vault.encrypted_password,
          iv: vault.iv,
          salt: vault.salt,
        },
        masterPassword
      )
      setRevealedPasswords({ ...revealedPasswords, [vault.id]: decrypted })
    } catch (error) {
      console.error('Decryption error:', error)
      alert('Invalid master password')
    }
  }

  const handleCopyPassword = (password: string, id: string) => {
    navigator.clipboard.writeText(password)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExportVault = (vault: PasswordVault) => {
    const exportData = {
      name: vault.name,
      encrypted_password: vault.encrypted_password,
      iv: vault.iv,
      salt: vault.salt,
      exported_at: new Date().toISOString(),
      note: 'This file contains an encrypted password. You need your master password to decrypt it.',
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${vault.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_backup.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <header className="border-b border-[#e2ddd5] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f4f3]">
              <Leaf className="h-5 w-5 text-[#2d9d92]" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-medium text-[#2d3748]" style={{ fontFamily: 'Newsreader, serif' }}>
              Password Locker
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/pricing">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[#2d9d92] hover:bg-[#e8f4f3] hover:text-[#237a72]"
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Upgrade</span>
              </Button>
            </Link>
            <Link to="/instructions">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[#718096] hover:bg-[#f5f1eb] hover:text-[#4a5568]"
              >
                <BookOpen className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Guide</span>
              </Button>
            </Link>
            <div className="hidden sm:block h-6 w-px bg-[#e2ddd5] mx-1" />
            <span className="hidden sm:block text-sm text-[#a0aec0] max-w-[150px] truncate">
              {user?.email}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-[#718096] hover:bg-[#f5f1eb] hover:text-[#4a5568]"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
          <div>
            <h1 className="text-3xl text-[#2d3748] mb-2" style={{ fontFamily: 'Newsreader, serif' }}>
              Your Vault
            </h1>
            <p className="text-[#718096]">
              Passwords stored with intention, retrieved with patience
            </p>
          </div>
          <Link to="/store">
            <Button className="bg-[#2d9d92] hover:bg-[#237a72] text-white shadow-sm hover:shadow-md transition-all">
              <Plus className="mr-2 h-4 w-4" />
              New Password
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2d9d92] border-t-transparent" />
              <div className="text-[#718096]">Loading your vault...</div>
            </div>
          </div>
        ) : vaults.length === 0 ? (
          <Card className="border-[#e2ddd5] bg-white card-shadow animate-fade-up delay-1">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f5f1eb]">
                <Key className="h-9 w-9 text-[#a0aec0]" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-xl text-[#2d3748]" style={{ fontFamily: 'Newsreader, serif' }}>
                Your vault is empty
              </h3>
              <p className="mb-6 text-center text-[#718096] max-w-sm">
                Store a password you want to keep out of easy reach. Perfect for Screen Time passcodes.
              </p>
              <Link to="/store">
                <Button className="bg-[#2d9d92] hover:bg-[#237a72] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Store Your First Password
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {vaults.map((vault, index) => (
              <Card 
                key={vault.id} 
                className="border-[#e2ddd5] bg-white card-shadow hover:card-shadow-hover transition-all duration-200 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-medium text-[#2d3748]" style={{ fontFamily: 'Newsreader, serif' }}>
                        {vault.name}
                      </CardTitle>
                      <p className="text-sm text-[#a0aec0] mt-1">
                        Added {new Date(vault.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(vault.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[#e53e3e] hover:bg-red-50 hover:text-[#c53030] -mr-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {revealedPasswords[vault.id] ? (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-amber-700">TEST MODE</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyPassword(revealedPasswords[vault.id], vault.id)}
                            className="h-6 px-2 text-amber-700 hover:bg-amber-100"
                          >
                            {copiedId === vault.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleTestOverride(vault, e)}
                            className="h-6 px-2 text-amber-700 hover:bg-amber-100"
                          >
                            <EyeOff className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="font-mono text-lg font-semibold text-amber-900 tracking-wider">
                        {revealedPasswords[vault.id]}
                      </p>
                    </div>
                  ) : null}
                  
                  <div className="flex gap-2">
                    <Link to={`/retrieve/${vault.id}`} className="flex-1">
                      <Button 
                        className="w-full bg-[#e8f4f3] hover:bg-[#d1ebe8] border border-[#2d9d92]/20 text-[#2d9d92] hover:text-[#237a72] transition-all"
                        variant="ghost"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Retrieve
                      </Button>
                    </Link>
                    <Link to={`/schedule/${vault.id}`}>
                      <Button
                        variant="outline"
                        className="border-[#e2ddd5] bg-white text-[#718096] hover:bg-[#f5f1eb] hover:text-[#4a5568]"
                        title="Scheduled unlocks"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => handleExportVault(vault)}
                      className="border-[#e2ddd5] bg-white text-[#718096] hover:bg-[#f5f1eb] hover:text-[#4a5568]"
                      title="Export backup"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => handleTestOverride(vault, e)}
                      className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      title="TEST OVERRIDE"
                    >
                      {revealedPasswords[vault.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
