import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Smartphone, Shield, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Instructions() {
  return (
    <div className="min-h-screen bg-[#F4F7F6] p-6">
      <div className="mx-auto max-w-[700px] pt-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[14px] text-[#7F8C8D] hover:text-[#2C3E50] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="mb-8 animate-fade-up">
          <h1 className="text-[24px] font-bold text-[#2C3E50] mb-2">iPhone Screen Time Setup</h1>
          <p className="text-[14px] text-[#7F8C8D]">
            Create a Screen Time passcode you won't remember
          </p>
        </div>

        <div className="space-y-5">
          {/* Initial Setup */}
          <Card className="border-[#E5E8E8] bg-white rounded-[12px] card-shadow animate-fade-up delay-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[16px] font-semibold text-[#2C3E50]">
                <Smartphone className="h-5 w-5 text-[#338089]" />
                Initial Screen Time Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[14px] text-[#7F8C8D]">
              <div>
                <h3 className="mb-1 font-semibold text-[#2C3E50]">1. Enable Screen Time</h3>
                <p>Go to <strong className="text-[#2C3E50]">Settings → Screen Time</strong>, click "Turn On Screen Time", then "This is My iPhone".</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-[#2C3E50]">2. Create Temporary Passcode</h3>
                <p>Click "Use Screen Time Passcode" and enter <strong className="text-[#2C3E50]">"1234"</strong> twice.</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-[#2C3E50]">3. Skip Recovery</h3>
                <p>On "Screen Time Passcode Recovery", click <strong className="text-[#2C3E50]">"Cancel"</strong> → <strong className="text-[#2C3E50]">"Skip"</strong>.</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-[#2C3E50]">4. Set Up App Limits</h3>
                <p>Go to "App Limits" → "Add Limit". Select apps and enable <strong className="text-[#2C3E50]">"Block at End of Limit"</strong>.</p>
              </div>
            </CardContent>
          </Card>

          {/* Password Locker Integration */}
          <Card className="border-[#E5E8E8] bg-white rounded-[12px] card-shadow animate-fade-up delay-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[16px] font-semibold text-[#2C3E50]">
                <Shield className="h-5 w-5 text-[#338089]" />
                Using Password Locker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[14px] text-[#7F8C8D]">
              <div>
                <h3 className="mb-1 font-semibold text-[#2C3E50]">1. Create New Password</h3>
                <p>Click <strong className="text-[#2C3E50]">"Add Password"</strong> and name it "iPhone Screen Time".</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-[#2C3E50]">2. Follow the PIN Generator</h3>
                <p>Password Locker generates a random PIN and guides you to enter it confusingly so you won't remember.</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-[#2C3E50]">3. Change Screen Time Passcode</h3>
                <p>On iPhone: <strong className="text-[#2C3E50]">Settings → Screen Time → Change Passcode</strong>. Enter "1234", then follow Password Locker's instructions.</p>
              </div>

              <div className="rounded-[8px] bg-[#338089]/10 border border-[#338089]/20 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-[#338089]">
                  <AlertCircle className="h-4 w-4" />
                  Important
                </h3>
                <ul className="ml-5 list-disc space-y-1 text-[12px]">
                  <li>Enter digits one at a time as shown</li>
                  <li>Press Delete when instructed</li>
                  <li>Don't try to remember the digits</li>
                  <li>Complete both entry rounds</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-1 font-semibold text-[#2C3E50]">4. Set Master Password</h3>
                <p>This encrypts your PIN for later retrieval via the typing challenge.</p>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-[#E5E8E8] bg-white rounded-[12px] card-shadow animate-fade-up delay-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[16px] font-semibold text-[#2C3E50]">
                <CheckCircle2 className="h-5 w-5 text-[#338089]" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[14px] text-[#7F8C8D]">
              <div>
                <h3 className="mb-1 font-semibold text-[#2C3E50]">Block not working after 1-minute warning?</h3>
                <p>Enable "Block at End of Limit" in App Limits settings.</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-[#2C3E50]">Why this works</h3>
                <p>The confusing entry process prevents memorization. The typing challenge adds friction when retrieving.</p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex justify-center gap-3 pt-4 animate-fade-up delay-4">
            <Link to="/store">
              <Button className="h-10 px-5 rounded-[8px] bg-[#EF7E5B] hover:bg-[#D16A4A] text-white text-[14px] font-semibold">
                Create New Password
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="h-10 px-5 rounded-[8px] border-[#E5E8E8] text-[#7F8C8D]">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
