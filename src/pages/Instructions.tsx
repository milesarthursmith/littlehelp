import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Smartphone, Lock, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Instructions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="mx-auto max-w-3xl pt-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center text-slate-400 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">How to Set up iPhone Screen Time</h1>
          <p className="text-slate-400">
            Use Password Locker to create a Screen Time passcode you won't remember
          </p>
        </div>

        <div className="space-y-6">
          {/* Initial Setup */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Smartphone className="h-5 w-5 text-emerald-500" />
                Initial Screen Time Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h3 className="mb-2 font-semibold text-white">1. Enable Screen Time</h3>
                <p>Go to <strong>Settings → Screen Time</strong>, and click "Turn On Screen Time" if it isn't already enabled. Select "Turn On Screen Time" and "This is My iPhone".</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-white">2. Create a Dummy Passcode</h3>
                <p>Click "Use Screen Time Passcode" and enter <strong>"1234"</strong> twice. This temporary passcode lets us access additional settings we'll need.</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-white">3. Skip Recovery</h3>
                <p>On the "Screen Time Passcode Recovery" screen, click <strong>"Cancel"</strong> in the top left corner, then <strong>"Skip"</strong> on the popup. This prevents overriding the Screen Time PIN with your Apple ID.</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-white">4. Set Up App Limits</h3>
                <p>Go to <strong>"App Limits"</strong>, turn on "App Limits", and click "Add Limit". Enter "1234" when prompted.</p>
                <p className="mt-2">Select the apps you want to block, choose a time limit, and make sure to select <strong>"Block at End of Limit"</strong>. This is crucial—otherwise the block won't be effective.</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-white">5. Optional: Block Websites</h3>
                <p>You can also block websites like "youtube.com" which will block both the website in Safari and the corresponding app.</p>
              </div>
            </CardContent>
          </Card>

          {/* Password Locker Integration */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="h-5 w-5 text-emerald-500" />
                Using Password Locker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h3 className="mb-2 font-semibold text-white">1. Create New Password</h3>
                <p>In Password Locker, click <strong>"Add Password"</strong> and enter a name like "iPhone Screen Time".</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-white">2. Start PIN Generator</h3>
                <p>Click the button to start the Screen Time PIN generator. Password Locker will generate a random 4-digit PIN and guide you through entering it into your iPhone in a way you won't remember.</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-white">3. Change Screen Time Passcode</h3>
                <p>On your iPhone, go to <strong>Settings → Screen Time → Change Screen Time Passcode</strong>. Enter your old passcode (<strong>"1234"</strong>), then follow the instructions shown in Password Locker.</p>
              </div>

              <div className="rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/20">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-emerald-400">
                  <AlertCircle className="h-5 w-5" />
                  Important: Follow Instructions Exactly
                </h3>
                <ul className="ml-6 list-disc space-y-1 text-sm">
                  <li>Enter digits one at a time as shown</li>
                  <li>Press Delete when instructed</li>
                  <li>Don't try to remember the digits</li>
                  <li>Complete both the initial entry and verification rounds</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-white">4. Complete Verification</h3>
                <p>Your iPhone will ask you to verify the passcode. Follow Password Locker's instructions again to enter it a second time.</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-white">5. Set Master Password</h3>
                <p>After completing the entry, set a master password in Password Locker. This encrypts your PIN so you can retrieve it later through the typing challenge.</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-white">6. Skip Recovery Again</h3>
                <p>On your iPhone, when prompted for Screen Time Passcode Recovery, click <strong>"Cancel"</strong> and then <strong>"Skip"</strong>. You don't want to be able to override the PIN with your Apple ID.</p>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Tips & Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-300">
              <div>
                <h3 className="mb-1 font-semibold text-white">If you can bypass the block after the 1-minute warning:</h3>
                <p>You didn't select "Block at End of Limit" when setting up App Limits. Go back and enable this option.</p>
              </div>

              <div>
                <h3 className="mb-1 font-semibold text-white">To retrieve your PIN later:</h3>
                <p>Select the password in Password Locker, complete the typing challenge, enter your master password, and your PIN will be revealed.</p>
              </div>

              <div>
                <h3 className="mb-1 font-semibold text-white">Why this works:</h3>
                <p>The confusing entry process (fake digits, deletions, distractions) prevents you from consciously remembering the PIN. The typing challenge adds friction when retrieving, making it harder to impulsively disable your blocks.</p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex justify-center gap-4 pt-4">
            <Link to="/store">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Create New Password
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

