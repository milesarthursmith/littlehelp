import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase, type PasswordVault, type ScheduledUnlock } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, Plus, Trash2, Clock } from 'lucide-react'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export default function ManageSchedule() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [vault, setVault] = useState<PasswordVault | null>(null)
  const [schedules, setSchedules] = useState<ScheduledUnlock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // New schedule form
  const [newDay, setNewDay] = useState(0)
  const [newStartTime, setNewStartTime] = useState('09:00')
  const [newEndTime, setNewEndTime] = useState('10:00')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    if (!id) return

    const { data: vaultData, error: vaultError } = await supabase
      .from('password_vaults')
      .select('*')
      .eq('id', id)
      .single()

    if (vaultError) {
      console.error('Error fetching vault:', vaultError)
      navigate('/dashboard')
      return
    }
    setVault(vaultData)

    const { data: scheduleData } = await supabase
      .from('scheduled_unlocks')
      .select('*')
      .eq('vault_id', id)
      .order('day_of_week', { ascending: true })

    setSchedules(scheduleData || [])
    setLoading(false)
  }

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vault || !user) return

    setSaving(true)

    const { data, error } = await supabase
      .from('scheduled_unlocks')
      .insert({
        vault_id: vault.id,
        user_id: user.id,
        day_of_week: newDay,
        start_time: newStartTime + ':00',
        end_time: newEndTime + ':00',
        enabled: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding schedule:', error)
      alert('Failed to add schedule')
    } else {
      setSchedules([...schedules, data])
    }
    setSaving(false)
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Delete this scheduled unlock?')) return

    const { error } = await supabase
      .from('scheduled_unlocks')
      .delete()
      .eq('id', scheduleId)

    if (error) {
      console.error('Error deleting schedule:', error)
    } else {
      setSchedules(schedules.filter(s => s.id !== scheduleId))
    }
  }

  const handleToggleSchedule = async (schedule: ScheduledUnlock) => {
    const { error } = await supabase
      .from('scheduled_unlocks')
      .update({ enabled: !schedule.enabled })
      .eq('id', schedule.id)

    if (error) {
      console.error('Error toggling schedule:', error)
    } else {
      setSchedules(schedules.map(s => 
        s.id === schedule.id ? { ...s, enabled: !s.enabled } : s
      ))
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <div className="text-slate-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-2xl pt-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">Scheduled Unlocks</CardTitle>
                <CardDescription className="text-slate-400">
                  {vault?.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-6">
              Set time windows when this password can be retrieved without completing the typing challenge.
            </p>

            {/* Add New Schedule */}
            <form onSubmit={handleAddSchedule} className="mb-6">
              <div className="rounded-lg bg-slate-800/30 border border-slate-700/50 p-4">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Schedule
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Day</Label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(parseInt(e.target.value))}
                      className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-white focus:border-emerald-500/50 focus:outline-none"
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Start Time</Label>
                    <Input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="border-slate-700 bg-slate-800/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">End Time</Label>
                    <Input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="border-slate-700 bg-slate-800/50 text-white"
                    />
                  </div>
                </div>
                <Button 
                  type="submit"
                  className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                  disabled={saving}
                >
                  {saving ? 'Adding...' : 'Add Schedule'}
                </Button>
              </div>
            </form>

            {/* Existing Schedules */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white">Active Schedules</h3>
              {schedules.length === 0 ? (
                <div className="rounded-lg bg-slate-800/30 border border-slate-700/50 p-6 text-center">
                  <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">No scheduled unlocks configured</p>
                  <p className="text-sm text-slate-500">Typing challenge is always required</p>
                </div>
              ) : (
                schedules.map(schedule => (
                  <div 
                    key={schedule.id} 
                    className={`rounded-lg border p-4 flex items-center justify-between ${
                      schedule.enabled 
                        ? 'bg-slate-800/30 border-slate-700/50' 
                        : 'bg-slate-800/10 border-slate-800/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleSchedule(schedule)}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          schedule.enabled ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${
                          schedule.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                      <div>
                        <p className="font-medium text-white">
                          {DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label}
                        </p>
                        <p className="text-sm text-slate-400">
                          {formatTime(schedule.start_time)} — {formatTime(schedule.end_time)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

