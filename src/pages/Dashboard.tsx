import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase, type PasswordVault } from '@/lib/supabase'
import { decryptPassword } from '@/lib/encryption'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Plus, LogOut, Key, Trash2, BookOpen, Shield, Eye, EyeOff, Copy, Check, Calendar, Download, Sparkles } from 'lucide-react'

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
      // Hide password
      const newRevealed = { ...revealedPasswords }
      delete newRevealed[vault.id]
      setRevealedPasswords(newRevealed)
      return
    }

    // Show password - prompt for master password
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-white">Password Locker</span>
              <p className="text-xs text-slate-500">Secure password vault</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/pricing">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Upgrade</span>
              </Button>
            </Link>
            <Link to="/instructions">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400 hover:bg-slate-800/50 hover:text-white"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Instructions</span>
              </Button>
            </Link>
            <div className="hidden items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5 sm:flex">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-slate-400">{user?.email}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-slate-400 hover:bg-slate-800/50 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1.5">Your Vault</h1>
            <p className="text-slate-400">Manage your stored passwords securely</p>
          </div>
          <div className="flex gap-3">
            <Link to="/instructions">
              <Button variant="outline" className="border-slate-700 bg-slate-800/30 text-slate-300 hover:bg-slate-800/50 hover:text-white backdrop-blur-sm">
                <BookOpen className="mr-2 h-4 w-4" />
                Instructions
              </Button>
            </Link>
            <Link to="/store">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                <Plus className="mr-2 h-4 w-4" />
                Add Password
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
              <div className="text-slate-400">Loading your vault...</div>
            </div>
          </div>
        ) : vaults.length === 0 ? (
          <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-xl shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900">
                <Key className="h-10 w-10 text-slate-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">No passwords stored</h3>
              <p className="mb-6 text-center text-slate-400 max-w-sm">
                Get started by adding your first password. We'll help you store it securely.
              </p>
              <Link to="/store">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Password
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {vaults.map((vault) => (
              <Card key={vault.id} className="group border-slate-800/50 bg-slate-900/30 backdrop-blur-xl transition-all hover:border-slate-700/50 hover:shadow-xl hover:shadow-emerald-500/5">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-white mb-1">{vault.name}</CardTitle>
                      <CardDescription className="text-slate-500 text-sm">
                        Added {new Date(vault.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(vault.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {revealedPasswords[vault.id] ? (
                    <div className="space-y-2">
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-amber-400">TEST OVERRIDE - Password:</span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPassword(revealedPasswords[vault.id], vault.id)}
                              className="h-6 px-2 text-amber-400 hover:text-amber-300"
                            >
                              {copiedId === vault.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleTestOverride(vault, e)}
                              className="h-6 px-2 text-amber-400 hover:text-amber-300"
                            >
                              <EyeOff className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="font-mono text-lg font-bold text-white tracking-widest">
                          {revealedPasswords[vault.id]}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {/* Action Buttons Row 1 */}
                  <div className="flex gap-2">
                    <Link to={`/retrieve/${vault.id}`} className="flex-1">
                      <Button 
                        className="w-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Retrieve
                      </Button>
                    </Link>
                    <Link to={`/schedule/${vault.id}`}>
                      <Button
                        variant="outline"
                        className="border-slate-700 bg-slate-800/30 text-slate-300 hover:bg-slate-800/50 hover:text-white"
                        title="Manage scheduled unlocks"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => handleExportVault(vault)}
                      className="border-slate-700 bg-slate-800/30 text-slate-300 hover:bg-slate-800/50 hover:text-white"
                      title="Export encrypted backup"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => handleTestOverride(vault, e)}
                      className="border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                      title="TEST OVERRIDE - Remove before production"
                    >
                      {revealedPasswords[vault.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
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
