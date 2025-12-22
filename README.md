# Password Locker

A personal password vault app designed to help you store Screen Time passcodes (and similar passwords) in a way you won't remember, while still being able to retrieve them when needed through a deliberate, friction-filled process.

## Overview

Password Locker helps you:
1. **Generate a random 4-digit PIN** for iOS Screen Time or other blockers
2. **Enter it into your device** through a confusing step-by-step process that prevents memorization
3. **Store it securely** with AES-256 encryption
4. **Retrieve it later** only after completing a typing challenge

This creates a barrier that stops impulsive unblocking while keeping the password accessible when you truly need it.

## Features

- **Blind PIN Entry**: Enter digits one at a time with distractions, fake digits, and deletions mixed in
- **Dual Entry**: Complete the confusing process twice (entry + verification)
- **AES-256-GCM Encryption**: Client-side encryption with your master password
- **Typing Challenge**: Must type a long passage accurately before retrieval
- **Supabase Backend**: Secure authentication and database storage
- **Modern UI**: Clean, dark-themed interface with smooth animations

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
   git clone https://github.com/yourusername/passlocker.git
   cd passlocker
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
2. **Complete the typing challenge** - type a ~500 character passage accurately
3. **Enter your master password**
4. **View your PIN** - copy it or use it to unlock Screen Time

## Project Structure

```
src/
├── components/ui/       # shadcn-style UI components
├── hooks/
│   └── useAuth.tsx      # Authentication context and hook
├── lib/
│   ├── supabase.ts      # Supabase client setup
│   ├── encryption.ts    # AES-256-GCM encryption utilities
│   └── utils.ts         # Tailwind merge utility
├── pages/
│   ├── Login.tsx        # Login page
│   ├── Signup.tsx       # Signup page
│   ├── Dashboard.tsx    # Vault list and management
│   ├── StorePassword.tsx    # PIN generator and storage
│   ├── RetrievePassword.tsx # Typing challenge + reveal
│   └── Instructions.tsx     # Setup guide
└── App.tsx              # Router and auth provider
```

## Database Schema

```sql
create table password_vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  encrypted_password text not null,
  iv text not null,
  salt text not null,
  created_at timestamptz default now()
);

-- Row Level Security ensures users can only access their own data
```

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

## TODO / Future Improvements

- [ ] Remove test override button before production
- [ ] Add configurable typing challenge length
- [ ] Add time-delay option before retrieval
- [ ] Add password strength requirements
- [ ] Add account recovery options
- [ ] Add export/import functionality

## Based On

This project is inspired by [Password Locker](https://password-locker.com/), a service that helps people set Screen Time passcodes they won't remember.

## License

MIT
