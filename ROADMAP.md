# Password Locker Roadmap

This document outlines planned features and improvements for Password Locker, inspired by [password-locker.com](https://password-locker.com/).

---

## Phase 1: Feature Parity ✅ COMPLETED

### ✅ Scheduled Unlocks
Users can set specific time windows when passwords can be retrieved without completing the challenge.

**Features:**
- Day of week + time range configuration
- Enable/disable individual schedules
- Multiple schedules per vault
- Check schedule before requiring typing challenge

---

### ✅ Emergency Access
24-hour delayed access for genuine emergencies.

**Features:**
- Request emergency access with 24-hour delay
- Cancel request to revert to typing challenge
- Countdown timer shows remaining wait time
- Automatic unlock when timer expires

---

### ✅ Offline Export
Download encrypted backup files for offline retrieval.

**Features:**
- Export passwords as encrypted JSON file
- Includes all encryption parameters (IV, salt)
- Same master password required for decryption
- Backup in case servers are unavailable

---

### ✅ Extended Retrieval Challenges
Retrieval process now takes ~15-20 minutes with multiple typing passages.

**Features:**
- 3 long passages to type (expandable)
- Error tracking and feedback
- Progress bar across all passages
- Emergency access option for genuine urgency

---

### Screen Time Workaround Blocking Guide
Comprehensive guide on closing iOS Screen Time loopholes.

**Topics to cover:**
- Disabling Apple ID recovery
- Blocking Siri workarounds
- Preventing app deletion/reinstall bypasses
- Family Sharing considerations

---

## Phase 2: Monetization

### Stripe Integration
Implement subscription payments for premium features.

**Pricing model:**
- Free tier: Basic storage + typing challenge
- Premium ($X/month): Scheduled unlocks, emergency access, priority support

**Implementation:**
- Stripe Checkout for subscriptions
- Webhook handlers for payment events
- `subscription` table in Supabase
- Feature gating based on subscription status

---

### Charity Donation Option
Alternative to typing challenge: donate $5 to charity to skip.

**Service:** [Every.org API](https://www.every.org/docs/donate-button)

**Flow:**
1. User clicks "Skip challenge with donation"
2. Redirect to Every.org checkout
3. On successful donation, reveal password
4. Log donation for user records

**Benefits:**
- Maintains friction (costs money)
- Positive social impact
- Tax-deductible for users

---

## Phase 3: Expansion

### Social Media Password Storage
Store passwords for TikTok, Instagram, Twitter, etc.

**Concept:**
1. User changes social media password to random string
2. Store new password in Password Locker
3. Log out of the app
4. Must complete challenge to retrieve password and log back in

**Considerations:**
- "Forgot Password" is still a workaround (email/phone reset)
- Could integrate with app blockers for full solution
- Different UX than Screen Time (manual password change)

**Potential workarounds to address:**
- Email access needed for password reset
- Phone number access for 2FA
- Browser saved passwords

---

### Multi-Device Sync
Sync passwords across devices with same account.

**Already supported** via Supabase (same user sees same vaults on any device).

---

### Browser Extension
Chrome/Firefox extension for storing website passwords with retrieval friction.

---

### Mobile App
Native iOS/Android apps for better integration with Screen Time setup.

---

## Technical Improvements

### Security Enhancements
- [ ] Upgrade from AES-128 to AES-256 (already done)
- [ ] Add 2FA for account login
- [ ] Rate limiting on password retrieval attempts
- [ ] Audit logging for all access attempts

### UX Improvements
- [ ] Remove test override button before production
- [ ] Add password strength meter for master password
- [ ] Improve blind entry sequence variety
- [ ] Add progress saving for typing challenge (resume if interrupted)
- [ ] Dark/light theme toggle

### Infrastructure
- [ ] Add error tracking (Sentry)
- [ ] Add analytics (privacy-respecting)
- [ ] Set up CI/CD pipeline
- [ ] Add automated testing

---

## Feature Comparison with Password Locker

| Feature | Password Locker | Our App | Status |
|---------|----------------|---------|--------|
| Blind PIN entry | ✅ | ✅ | ✅ Done |
| Typing challenge | ✅ | ✅ | ✅ Done |
| AES encryption | AES-128 | AES-256 | ✅ Done (better) |
| Scheduled unlocks | ✅ | ✅ | ✅ Done |
| Emergency access | ✅ | ✅ | ✅ Done |
| Offline export | ✅ | ✅ | ✅ Done |
| ~20 min retrieval | ✅ | ✅ (~15 min) | ✅ Done |
| Stripe payments | ✅ | ⚠️ | UI Ready, needs backend |
| Charity donation | ✅ | ⚠️ | UI Ready, needs integration |

---

## Resources

- [Password Locker](https://password-locker.com/) - Original inspiration
- [Every.org API](https://www.every.org/docs/donate-button) - Charity donations
- [Stripe Docs](https://stripe.com/docs) - Payment processing
- [Supabase Docs](https://supabase.com/docs) - Backend

---

*Last updated: December 2024*

