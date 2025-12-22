# Password Locker Roadmap

This document outlines planned features and improvements for Password Locker, inspired by [password-locker.com](https://password-locker.com/).

---

## Phase 1: Feature Parity (Priority)

### Scheduled Unlocks
Allow users to set specific time windows when passwords can be retrieved without completing the challenge.

**Use cases:**
- Weekly Sunday morning for app updates
- Work hours for productivity apps
- Scheduled maintenance windows

**Implementation:**
- Add `unlock_schedule` table with day/time ranges
- Check schedule before requiring typing challenge
- UI for managing schedules in dashboard

---

### Emergency Access
Provide immediate password access in genuine emergencies, with safeguards to prevent abuse.

**Options:**
- Waiting period (e.g., 24-hour delay before emergency access)
- Limited uses per month
- Requires email confirmation
- Premium feature

---

### Offline Export
Allow users to download an encrypted file containing their passwords for offline retrieval.

**Implementation:**
- Export passwords as encrypted JSON file
- Include decryption tool/instructions
- Same challenge required for offline decryption
- Useful if servers are unavailable

---

### Extended Retrieval Challenges
Make the retrieval process more tedious (~20 minutes as per original Password Locker).

**Options:**
- Longer typing passages
- Multiple typing rounds
- Wait timers between steps
- Math problems or puzzles
- Configurable difficulty per password

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
| Blind PIN entry | ✅ | ✅ | Done |
| Typing challenge | ✅ | ✅ | Done |
| AES encryption | AES-128 | AES-256 | Done (better) |
| Scheduled unlocks | ✅ | ❌ | Planned |
| Emergency access | ✅ | ❌ | Planned |
| Offline export | ✅ | ❌ | Planned |
| ~20 min retrieval | ✅ | ~5 min | Needs improvement |
| Stripe payments | ✅ | ❌ | Planned |
| Pay-what-you-want | ✅ | ❌ | Planned |

---

## Resources

- [Password Locker](https://password-locker.com/) - Original inspiration
- [Every.org API](https://www.every.org/docs/donate-button) - Charity donations
- [Stripe Docs](https://stripe.com/docs) - Payment processing
- [Supabase Docs](https://supabase.com/docs) - Backend

---

*Last updated: December 2024*

