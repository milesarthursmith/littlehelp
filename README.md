# Password Locker

A personal password vault app designed to help you store Screen Time passcodes (and similar passwords) in a way you won't remember, while still being able to retrieve them when needed through a deliberate, friction-filled process.

## Overview

Password Locker helps you:
1. **Generate a random 4-digit PIN** for iOS Screen Time or other blockers
2. **Enter it into your device** through a confusing step-by-step process that prevents memorization
3. **Store it securely** with AES-256 encryption
4. **Retrieve it later** only after completing a ~15-20 minute typing challenge

This creates a barrier that stops impulsive unblocking while keeping the password accessible when you truly need it.

## Features

### Core Features
- **Blind PIN Entry**: Enter digits one at a time with distractions, fake digits, and deletions mixed in
- **Dual Entry**: Complete the confusing process twice (entry + verification)
- **AES-256-GCM Encryption**: Client-side encryption with your master password
- **Extended Typing Challenge**: Type 3 long passages (~15-20 min total) before retrieval
- **Modern UI**: Clean, dark-themed interface with smooth animations

### Advanced Features
- **Scheduled Unlocks**: Set time windows (e.g., Sunday mornings) when the challenge is skipped
- **Emergency Access**: Request immediate access with a 24-hour delay
- **Offline Export**: Download encrypted backups for offline retrieval
- **Pricing Page**: Ready for Stripe integration with premium features
- **Charity Donation Skip**: UI ready for Every.org integration

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Backend**: Supabase (Auth + PostgreSQL)
- **Encryption**: Web Crypto API (AES-256-GCM with PBKDF2 key derivation)
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/milesarthursmith/littlehelp.git
   cd littlehelp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to the SQL Editor and run the schema from `supabase-schema.sql`
   - Go to Settings → API and copy your Project URL and anon key

4. **Configure environment**
   
   Create a `.env` file in the project root:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_CHECKOUT_URL=your_stripe_checkout_url (optional)
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

## How It Works

### Storing a Password

1. **Name your password** (e.g., "iOS Screen Time")
2. **Follow the PIN generator** - the app shows you digits one at a time:
   - "Enter 8 into your iPhone" → Next
   - "Press Delete" → Next
   - "Look away for a moment..." → Next
   - "Enter 4 into your iPhone" → Next
   - etc.
3. **Verify the PIN** - repeat the process for iPhone's verification prompt
4. **Set a master password** - this encrypts your PIN for storage

The confusing sequence (fake digits, deletions, distractions, waits) prevents you from consciously remembering the PIN.

### Retrieving a Password

1. **Select the password** from your vault
2. **Complete the typing challenge** - type 3 long passages (~500 chars each)
3. **Enter your master password**
4. **View your PIN** - copy it or use it to unlock Screen Time

**Alternative Retrieval Options:**
- **Scheduled Unlock**: If you've set a schedule (e.g., Sundays 9-10am), skip the challenge
- **Emergency Access**: Request immediate access with a 24-hour waiting period

## Project Structure

```
src/
├── components/ui/       # shadcn-style UI components
├── hooks/
│   └── useAuth.tsx      # Authentication context and hook
├── lib/
│   ├── supabase.ts      # Supabase client setup + types
│   ├── encryption.ts    # AES-256-GCM encryption utilities
│   └── utils.ts         # Tailwind merge utility
├── pages/
│   ├── Login.tsx            # Login page
│   ├── Signup.tsx           # Signup page
│   ├── Dashboard.tsx        # Vault list and management
│   ├── StorePassword.tsx    # PIN generator and storage
│   ├── RetrievePassword.tsx # Typing challenge + emergency access
│   ├── ManageSchedule.tsx   # Scheduled unlock configuration
│   ├── Pricing.tsx          # Premium plans + charity donation
│   └── Instructions.tsx     # Setup guide
└── App.tsx              # Router and auth provider
```

## Database Schema

See `supabase-schema.sql` for the complete schema including:
- `password_vaults` - Encrypted password storage
- `scheduled_unlocks` - Time windows for challenge-free access
- `emergency_access_requests` - Delayed emergency access tracking
- `user_subscriptions` - Stripe subscription data (for premium features)

All tables use Row Level Security (RLS) to ensure users can only access their own data.

## Security

- **Client-side encryption**: Passwords are encrypted in the browser before being sent to Supabase
- **PBKDF2 key derivation**: 100,000 iterations with SHA-256
- **AES-256-GCM**: Authenticated encryption
- **Row Level Security**: Database policies restrict access to owner's data only
- **Master password never stored**: Only used locally for encryption/decryption

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## TODO Before Production

- [ ] Remove test override button (Dashboard.tsx)
- [ ] Configure Stripe webhook handler for subscriptions
- [ ] Integrate Every.org API for charity donations
- [ ] Set up error tracking (Sentry)
- [ ] Add rate limiting on retrieval attempts

See `ROADMAP.md` for full list of planned features.

## Based On

This project is inspired by [Password Locker](https://password-locker.com/), a service that helps people set Screen Time passcodes they won't remember.

## License

MIT
