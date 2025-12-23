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
  const [newDay, setNewDay] = useState(0)
  const [newStartTime, setNewStartTime] = useState('09:00')
  const [newEndTime, setNewEndTime] = useState('10:00')

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    if (!id) return
    const { data: vaultData, error: vaultError } = await supabase.from('password_vaults').select('*').eq('id', id).single()
    if (vaultError) { navigate('/dashboard'); return }
    setVault(vaultData)
    const { data: scheduleData } = await supabase.from('scheduled_unlocks').select('*').eq('vault_id', id).order('day_of_week', { ascending: true })
    setSchedules(scheduleData || [])
    setLoading(false)
  }

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vault || !user) return
    setSaving(true)
    const { data, error } = await supabase.from('scheduled_unlocks').insert({
      vault_id: vault.id, user_id: user.id, day_of_week: newDay,
      start_time: newStartTime + ':00', end_time: newEndTime + ':00', enabled: true,
    }).select().single()
    if (error) {
      if (error.code === '42P01') alert('Run supabase-schema.sql first')
      else alert(`Failed: ${error.message}`)
    } else setSchedules([...schedules, data])
    setSaving(false)
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Delete this schedule?')) return
    const { error } = await supabase.from('scheduled_unlocks').delete().eq('id', scheduleId)
    if (!error) setSchedules(schedules.filter(s => s.id !== scheduleId))
  }

  const handleToggleSchedule = async (schedule: ScheduledUnlock) => {
    const { error } = await supabase.from('scheduled_unlocks').update({ enabled: !schedule.enabled }).eq('id', schedule.id)
    if (!error) setSchedules(schedules.map(s => s.id === schedule.id ? { ...s, enabled: !s.enabled } : s))
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#338089] border-t-transparent" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F7F6] p-6">
      <div className="mx-auto max-w-[600px] pt-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[14px] text-[#7F8C8D] hover:text-[#2C3E50] mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <Card className="border-[#E5E8E8] bg-white rounded-[12px] card-shadow animate-fade-up">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#338089]">
                <Calendar className="h-5 w-5 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold text-[#2C3E50]">Scheduled Unlocks</CardTitle>
                <CardDescription className="text-[14px] text-[#7F8C8D]">{vault?.name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-[14px] text-[#7F8C8D] mb-5">
              Skip the typing challenge during these windows.
            </p>

            {/* Add New */}
            <form onSubmit={handleAddSchedule} className="mb-6">
              <div className="rounded-[8px] bg-[#F4F7F6] border border-[#E5E8E8] p-4">
                <h3 className="text-[14px] font-semibold text-[#2C3E50] mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Schedule
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-[12px] text-[#7F8C8D]">Day</Label>
                    <select value={newDay} onChange={(e) => setNewDay(parseInt(e.target.value))}
                      className="w-full h-10 rounded-[8px] border border-[#E5E8E8] bg-white px-3 text-[14px] text-[#2C3E50] focus:border-[#338089] focus:outline-none">
                      {DAYS_OF_WEEK.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[12px] text-[#7F8C8D]">Start</Label>
                    <Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="h-10 rounded-[8px] border-[#E5E8E8]" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[12px] text-[#7F8C8D]">End</Label>
                    <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} className="h-10 rounded-[8px] border-[#E5E8E8]" />
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="mt-4 h-9 rounded-[8px] bg-[#338089] hover:bg-[#266067] text-white text-[14px] font-medium">
                  {saving ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </form>

            {/* Existing */}
            <div className="space-y-3">
              <h3 className="text-[14px] font-semibold text-[#2C3E50]">Active Schedules</h3>
              {schedules.length === 0 ? (
                <div className="rounded-[8px] bg-[#F4F7F6] border border-[#E5E8E8] p-6 text-center">
                  <Clock className="h-8 w-8 text-[#95A5A6] mx-auto mb-2" />
                  <p className="text-[14px] text-[#7F8C8D]">No schedules configured</p>
                  <p className="text-[12px] text-[#95A5A6]">Typing challenge always required</p>
                </div>
              ) : (
                schedules.map(schedule => (
                  <div key={schedule.id} className={`rounded-[8px] border p-4 flex items-center justify-between ${schedule.enabled ? 'bg-white border-[#E5E8E8]' : 'bg-[#F4F7F6] border-[#E5E8E8] opacity-60'}`}>
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleToggleSchedule(schedule)} className={`w-10 h-6 rounded-full transition-colors ${schedule.enabled ? 'bg-[#338089]' : 'bg-[#E5E8E8]'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${schedule.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                      <div>
                        <p className="text-[14px] font-medium text-[#2C3E50]">{DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label}</p>
                        <p className="text-[12px] text-[#7F8C8D]">{formatTime(schedule.start_time)} — {formatTime(schedule.end_time)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSchedule(schedule.id)} className="h-8 w-8 p-0 text-[#E74C3C] hover:bg-red-50">
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
