import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase, type PasswordVault } from '@/lib/supabase'
import { decryptPassword } from '@/lib/encryption'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Shield, Plus, LogOut, Key, Trash2, BookOpen, Eye, EyeOff, Copy, Check, Calendar, Download, Home, Settings } from 'lucide-react'

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
    <div className="min-h-screen bg-[#F4F7F6] flex">
      {/* Sidebar */}
      <aside className="w-[220px] bg-white border-r border-[#E5E8E8] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#E5E8E8]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#338089]">
              <Shield className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-[16px] font-semibold text-[#2C3E50]">PassLocker</span>
          </div>
        </div>
        
        {/* Nav */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link 
                to="/dashboard" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-[#338089] text-white text-[14px] font-medium"
              >
                <Home className="h-5 w-5" strokeWidth={1.5} />
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/instructions" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[#7F8C8D] hover:bg-[#F4F7F6] text-[14px] font-medium transition-colors"
              >
                <BookOpen className="h-5 w-5" strokeWidth={1.5} />
                Instructions
              </Link>
            </li>
            <li>
              <Link 
                to="/pricing" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[#7F8C8D] hover:bg-[#F4F7F6] text-[14px] font-medium transition-colors"
              >
                <Settings className="h-5 w-5" strokeWidth={1.5} />
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* User */}
        <div className="p-4 border-t border-[#E5E8E8]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-[#338089] flex items-center justify-center text-white text-[12px] font-semibold">
              {user?.email?.[0].toUpperCase()}
            </div>
            <span className="text-[12px] text-[#7F8C8D] truncate flex-1">{user?.email}</span>
          </div>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-[14px] text-[#7F8C8D] hover:text-[#2C3E50] transition-colors"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-[900px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-fade-up">
            <div>
              <h1 className="text-[24px] font-bold text-[#2C3E50] mb-1">Your Vault</h1>
              <p className="text-[14px] text-[#7F8C8D]">Manage your stored passwords</p>
            </div>
            <Link to="/store">
              <Button className="h-10 px-5 rounded-[8px] bg-[#EF7E5B] hover:bg-[#D16A4A] text-white text-[14px] font-semibold gap-2">
                <Plus className="h-4 w-4" strokeWidth={2} />
                Add a new password
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#338089] border-t-transparent" />
                <div className="text-[14px] text-[#7F8C8D]">Loading...</div>
              </div>
            </div>
          ) : vaults.length === 0 ? (
            <Card className="border-[#E5E8E8] bg-white rounded-[12px] card-shadow animate-fade-up delay-1">
              <CardContent className="flex flex-col items-center justify-center py-16 px-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F7F6]">
                  <Key className="h-7 w-7 text-[#95A5A6]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[18px] font-bold text-[#2C3E50] mb-2">No passwords yet</h3>
                <p className="text-[14px] text-[#7F8C8D] text-center max-w-[300px] mb-6">
                  Store a password you want to keep out of easy reach.
                </p>
                <Link to="/store">
                  <Button className="h-10 px-5 rounded-[8px] bg-[#EF7E5B] hover:bg-[#D16A4A] text-white text-[14px] font-semibold gap-2">
                    <Plus className="h-4 w-4" />
                    Add your first password
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {vaults.map((vault, index) => (
                <Card 
                  key={vault.id} 
                  className="border-[#E5E8E8] bg-white rounded-[12px] card-shadow hover:card-shadow-hover transition-shadow animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardHeader className="pb-3 px-4 pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[16px] font-semibold text-[#2C3E50]">{vault.name}</h3>
                        <p className="text-[12px] text-[#95A5A6] mt-0.5">
                          {new Date(vault.created_at).toLocaleDateString('en-US', { 
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
                        className="h-8 w-8 p-0 text-[#95A5A6] hover:text-[#E74C3C] hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {revealedPasswords[vault.id] && (
                      <div className="rounded-[8px] bg-amber-50 border border-amber-200 p-3 animate-fade-in">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-medium text-amber-700">TEST MODE</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPassword(revealedPasswords[vault.id], vault.id)}
                              className="h-6 w-6 p-0 text-amber-700 hover:bg-amber-100"
                            >
                              {copiedId === vault.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleTestOverride(vault, e)}
                              className="h-6 w-6 p-0 text-amber-700 hover:bg-amber-100"
                            >
                              <EyeOff className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="font-mono text-[16px] font-semibold text-amber-900 tracking-wide">
                          {revealedPasswords[vault.id]}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Link to={`/retrieve/${vault.id}`} className="flex-1">
                        <Button 
                          className="w-full h-9 rounded-[8px] bg-[#338089] hover:bg-[#266067] text-white text-[14px] font-medium gap-2"
                        >
                          <Key className="h-4 w-4" strokeWidth={1.5} />
                          Retrieve
                        </Button>
                      </Link>
                      <Link to={`/schedule/${vault.id}`}>
                        <Button
                          variant="outline"
                          className="h-9 w-9 p-0 rounded-[8px] border-[#E5E8E8] text-[#7F8C8D] hover:bg-[#F4F7F6] hover:text-[#338089]"
                        >
                          <Calendar className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => handleExportVault(vault)}
                        className="h-9 w-9 p-0 rounded-[8px] border-[#E5E8E8] text-[#7F8C8D] hover:bg-[#F4F7F6] hover:text-[#338089]"
                      >
                        <Download className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => handleTestOverride(vault, e)}
                        className="h-9 w-9 p-0 rounded-[8px] border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
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
        </div>
      </main>
    </div>
  )
}
