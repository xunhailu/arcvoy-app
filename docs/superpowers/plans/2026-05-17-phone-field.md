# Phone Number Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mandatory, internationally-validated phone number field to Step 2 of the job application form, with a dial code dropdown that auto-selects from the applicant's chosen country.

**Architecture:** Extract all phone logic (dial codes, validation) into `src/lib/phone.js`. Apply.jsx imports and uses it for field state, auto-selection, and validation. `applications.js` stores the composed number and surfaces it in the admin email.

**Tech Stack:** libphonenumber-js (Google's phone validation library), vitest (unit tests), React CSS Modules (existing pattern)

---

## File Map

| Action | File | What changes |
|---|---|---|
| Create | `src/lib/phone.js` | DIAL_CODES data, `dialCodeForCountry()`, `validatePhone()` |
| Create | `src/lib/phone.test.js` | Unit tests for phone utility |
| Modify | `vite.config.js` | Add vitest `test` block |
| Modify | `package.json` | Add `libphonenumber-js` + `vitest` to scripts |
| Modify | `src/pages/Apply.module.css` | Add `.phoneRow`, `.dialSelect`, `.dialSelectError`, `.phoneInput` |
| Modify | `src/pages/Apply.jsx` | State, imports, auto-select, validation, UI (Step 2 + Step 3) |
| Modify | `src/lib/applications.js` | Add `phone` column to DB insert + admin email row |

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

- [ ] **Step 1: Install libphonenumber-js and vitest**

```bash
cd /Users/x703/Desktop/arcvoy-app-1
npm install libphonenumber-js
npm install -D vitest
```

Expected output: both packages added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Add test script to package.json**

Open `package.json`. In the `"scripts"` block, add `"test": "vitest run"` so the block reads:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 3: Configure vitest in vite.config.js**

Read the current `vite.config.js`, then add a `test` block:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vite.config.js
git commit -m "chore: add libphonenumber-js and vitest"
```

---

### Task 2: Create phone utility and tests

**Files:**
- Create: `src/lib/phone.js`
- Create: `src/lib/phone.test.js`

- [ ] **Step 1: Write the failing tests first**

Create `src/lib/phone.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { DIAL_CODES, dialCodeForCountry, validatePhone } from './phone'

describe('DIAL_CODES', () => {
  it('contains an entry for every platform country except Other', () => {
    const names = DIAL_CODES.map(d => d.country)
    expect(names).toContain('United States')
    expect(names).toContain('United Kingdom')
    expect(names).toContain('Nigeria')
    expect(names).toContain('Singapore')
    expect(names).not.toContain('Other')
  })

  it('every entry has country, iso, code and flag', () => {
    DIAL_CODES.forEach(d => {
      expect(d.country).toBeTruthy()
      expect(d.iso).toMatch(/^[A-Z]{2}$/)
      expect(d.code).toMatch(/^\+\d+$/)
      expect(d.flag).toBeTruthy()
    })
  })
})

describe('dialCodeForCountry', () => {
  it('returns the dial code for a known country', () => {
    expect(dialCodeForCountry('United Kingdom')).toBe('+44')
    expect(dialCodeForCountry('Nigeria')).toBe('+234')
    expect(dialCodeForCountry('Japan')).toBe('+81')
    expect(dialCodeForCountry('United States')).toBe('+1')
    expect(dialCodeForCountry('Canada')).toBe('+1')
  })

  it('returns empty string for unmapped values', () => {
    expect(dialCodeForCountry('Other')).toBe('')
    expect(dialCodeForCountry('')).toBe('')
    expect(dialCodeForCountry('Atlantis')).toBe('')
  })
})

describe('validatePhone', () => {
  it('accepts a valid UK mobile number', () => {
    expect(validatePhone('+44', '7911123456')).toBe(true)
  })

  it('accepts a valid Nigerian mobile number', () => {
    expect(validatePhone('+234', '8012345678')).toBe(true)
  })

  it('accepts a valid US number', () => {
    expect(validatePhone('+1', '2025551234')).toBe(true)
  })

  it('accepts a valid Indian mobile number', () => {
    expect(validatePhone('+91', '9876543210')).toBe(true)
  })

  it('accepts a valid German number', () => {
    expect(validatePhone('+49', '15123456789')).toBe(true)
  })

  it('rejects too-short numbers', () => {
    expect(validatePhone('+44', '123')).toBe(false)
    expect(validatePhone('+1', '555')).toBe(false)
  })

  it('rejects all-zero gibberish', () => {
    expect(validatePhone('+44', '00000000000')).toBe(false)
  })

  it('strips non-digit characters before validating', () => {
    // spaces and dashes are common input — should still validate
    expect(validatePhone('+44', '07911 123456')).toBe(true)
    expect(validatePhone('+1', '(202) 555-1234')).toBe(true)
  })

  it('rejects empty or whitespace-only number', () => {
    expect(validatePhone('+44', '')).toBe(false)
    expect(validatePhone('+44', '   ')).toBe(false)
  })

  it('falls back to length check when no dial code is provided', () => {
    expect(validatePhone('', '123456789')).toBe(true)   // 9 digits — valid
    expect(validatePhone('', '1234')).toBe(false)        // too short
    expect(validatePhone('', '1234567890123456')).toBe(false) // too long (>15)
  })
})
```

- [ ] **Step 2: Run tests — expect them to fail (phone.js does not exist yet)**

```bash
npm test
```

Expected: multiple failures — `Cannot find module './phone'`

- [ ] **Step 3: Create src/lib/phone.js**

```js
import { isValidPhoneNumber } from 'libphonenumber-js'

export const DIAL_CODES = [
  { country: 'United States',  iso: 'US', code: '+1',   flag: '🇺🇸' },
  { country: 'United Kingdom', iso: 'GB', code: '+44',  flag: '🇬🇧' },
  { country: 'Canada',         iso: 'CA', code: '+1',   flag: '🇨🇦' },
  { country: 'Australia',      iso: 'AU', code: '+61',  flag: '🇦🇺' },
  { country: 'Germany',        iso: 'DE', code: '+49',  flag: '🇩🇪' },
  { country: 'France',         iso: 'FR', code: '+33',  flag: '🇫🇷' },
  { country: 'China',          iso: 'CN', code: '+86',  flag: '🇨🇳' },
  { country: 'India',          iso: 'IN', code: '+91',  flag: '🇮🇳' },
  { country: 'Nigeria',        iso: 'NG', code: '+234', flag: '🇳🇬' },
  { country: 'Brazil',         iso: 'BR', code: '+55',  flag: '🇧🇷' },
  { country: 'Japan',          iso: 'JP', code: '+81',  flag: '🇯🇵' },
  { country: 'Italy',          iso: 'IT', code: '+39',  flag: '🇮🇹' },
  { country: 'Spain',          iso: 'ES', code: '+34',  flag: '🇪🇸' },
  { country: 'Netherlands',    iso: 'NL', code: '+31',  flag: '🇳🇱' },
  { country: 'Sweden',         iso: 'SE', code: '+46',  flag: '🇸🇪' },
  { country: 'Turkey',         iso: 'TR', code: '+90',  flag: '🇹🇷' },
  { country: 'Poland',         iso: 'PL', code: '+48',  flag: '🇵🇱' },
  { country: 'Denmark',        iso: 'DK', code: '+45',  flag: '🇩🇰' },
  { country: 'Singapore',      iso: 'SG', code: '+65',  flag: '🇸🇬' },
]

export function dialCodeForCountry(countryName) {
  const entry = DIAL_CODES.find(d => d.country === countryName)
  return entry ? entry.code : ''
}

export function validatePhone(dialCode, number) {
  const digits = String(number || '').replace(/\D/g, '')
  if (!digits) return false
  if (!dialCode) {
    return digits.length >= 5 && digits.length <= 15
  }
  try {
    return isValidPhoneNumber(dialCode + digits)
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npm test
```

Expected: all tests pass with `✓` markers.

- [ ] **Step 5: Commit**

```bash
git add src/lib/phone.js src/lib/phone.test.js
git commit -m "feat: add phone validation utility with dial codes"
```

---

### Task 3: Add CSS for phone field

**Files:**
- Modify: `src/pages/Apply.module.css`

- [ ] **Step 1: Append phone styles to Apply.module.css**

Open [Apply.module.css](src/pages/Apply.module.css) and append the following block before the final `@media` queries (i.e., before the `@media (max-width: 900px)` block at line 282):

```css
/* ── Phone field ── */
.phoneRow { display: flex; gap: 8px; align-items: stretch; }

.dialSelect {
  background: var(--input-bg); border: 1px solid var(--bd2);
  color: var(--tx); font-family: 'Raleway', sans-serif; font-size: 14px;
  padding: 12px 10px 12px 12px; outline: none; border-radius: 6px;
  transition: border-color .2s, box-shadow .2s;
  cursor: pointer; min-width: 108px; flex-shrink: 0;
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
  padding-right: 28px;
}
.dialSelect:focus { border-color: rgba(204,102,51,.5); box-shadow: 0 0 0 3px rgba(204,102,51,.07); }
.dialSelectError { border-color: #a03030 !important; }

.phoneInput { flex: 1; min-width: 0; }
```

Also add inside the `@media (max-width: 900px)` block (which already handles grid2 going single column). The phone row naturally stacks because it uses flexbox — no media query change needed.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Apply.module.css
git commit -m "feat: add phone field CSS"
```

---

### Task 4: Update Apply.jsx — logic (imports, state, setCountry, validation)

**Files:**
- Modify: `src/pages/Apply.jsx`

- [ ] **Step 1: Add import for phone utilities**

At the top of [Apply.jsx](src/pages/Apply.jsx), after the existing imports, add:

```js
import { DIAL_CODES, dialCodeForCountry, validatePhone } from '../lib/phone'
```

- [ ] **Step 2: Add error messages for phone fields**

In the `ERROR_MESSAGES` object (lines 14–29 of Apply.jsx), add two new entries:

```js
const ERROR_MESSAGES = {
  first:    'First name is required',
  last:     'Surname is required',
  email:    'Enter a valid email address',
  phoneCode:'Please select a country dial code',
  phone:    'Enter a valid phone number',
  country:  'Please select your country',
  state:    'State or region is required',
  city:     'City is required',
  zip:      'Postcode is required',
  address:  'Street address is required',
  age:      'You must confirm you are 18 or older to apply',
  dob:      'Date of birth is required',
  cv:       'Please upload your CV to continue',
  id:       'Please upload the front of your ID',
  idType:   'Please select your ID type',
  idBack:   "Please upload the back of your driver's license",
}
```

- [ ] **Step 3: Add phoneCode and phone to fields state**

In the `useState` initialiser for `fields` (around line 84), add `phoneCode` and `phone` to the returned object:

```js
const [fields, setFields] = useState(() => {
  const meta = user?.user_metadata || {}
  const nameParts = (meta.full_name || '').trim().split(/\s+/)
  let saved = {}
  if (storageKey) {
    try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') } catch {}
  }
  return {
    first: saved.first || nameParts[0] || '', last: saved.last || nameParts.slice(1).join(' ') || '',
    email: saved.email || user?.email || '',
    dobDay: saved.dobDay || '', dobMonth: saved.dobMonth || '', dobYear: saved.dobYear || '',
    country: saved.country || '', state: saved.state || '', city: saved.city || '',
    zip: saved.zip || '', address: saved.address || '',
    phoneCode: saved.phoneCode || '', phone: saved.phone || '',
    linkedin: saved.linkedin || meta.linkedin || '',
    lang1: saved.lang1 || '', lang2: saved.lang2 || '',
  }
})
```

- [ ] **Step 4: Update setCountry to auto-select dial code**

Replace the existing `setCountry` function (around line 134) with:

```js
const setCountry = v => {
  const code = dialCodeForCountry(v)
  setFields(f => ({ ...f, country: v, state: '', phoneCode: code || f.phoneCode }))
  if (errors.country) setErrors(prev => ({ ...prev, country: false }))
}
```

- [ ] **Step 5: Update blurCheck to handle phone**

Replace the existing `blurCheck` function (around line 139) with:

```js
const blurCheck = (key) => {
  if (key === 'phone') {
    if (!fields.phoneCode) {
      setErrors(prev => ({ ...prev, phoneCode: true }))
      return
    }
    setErrors(prev => ({ ...prev, phone: !validatePhone(fields.phoneCode, fields.phone) }))
    return
  }
  const val = fields[key]
  let invalid = false
  if (key === 'email') invalid = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
  else invalid = !String(val || '').trim()
  setErrors(prev => ({ ...prev, [key]: invalid }))
}
```

- [ ] **Step 6: Update validateStep2 to validate phone**

Replace the existing `validateStep2` function (around line 160) with:

```js
const validateStep2 = () => {
  const e = {}
  if (!fields.first.trim())   e.first   = true
  if (!fields.last.trim())    e.last    = true
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = true
  if (!fields.phoneCode)      e.phoneCode = true
  if (!validatePhone(fields.phoneCode, fields.phone))    e.phone = true
  if (!fields.country)        e.country = true
  if (!fields.state.trim())   e.state   = true
  if (!fields.city.trim())    e.city    = true
  if (!fields.zip.trim())     e.zip     = true
  if (!fields.address.trim()) e.address = true
  if (!ageConfirmed)          e.age     = true
  if (!fields.dobDay || !fields.dobMonth || !fields.dobYear) e.dob = true
  setErrors(e)
  return Object.keys(e).length === 0
}
```

- [ ] **Step 7: Commit logic changes**

```bash
git add src/pages/Apply.jsx
git commit -m "feat: add phone field logic — state, auto-select, validation"
```

---

### Task 5: Update Apply.jsx — Step 2 phone field UI

**Files:**
- Modify: `src/pages/Apply.jsx`

- [ ] **Step 1: Add phone field JSX below the email field in Step 2**

In [Apply.jsx](src/pages/Apply.jsx), locate the email field block in Step 2 (around line 653–657). It currently reads:

```jsx
<div className={styles.fg}>
  <label className={styles.fl}>Email Address <span>*</span></label>
  <input type="email" className={`${styles.fi} ${errors.email ? styles.fiError : ''}`}
    value={fields.email} onChange={set('email')} onBlur={() => blurCheck('email')} />
  {errors.email && <span className={styles.fieldError}>{ERROR_MESSAGES.email}</span>}
</div>
```

Insert the following block immediately after it (before the Date of Birth field):

```jsx
<div className={styles.fg}>
  <label className={styles.fl}>Phone Number <span>*</span></label>
  <div className={styles.phoneRow}>
    <select
      className={`${styles.dialSelect} ${errors.phoneCode ? styles.dialSelectError : ''}`}
      value={fields.phoneCode}
      onChange={e => {
        setFields(f => ({ ...f, phoneCode: e.target.value }))
        setErrors(prev => ({ ...prev, phoneCode: false, phone: false }))
      }}
    >
      <option value="">Code</option>
      {DIAL_CODES.map(d => (
        <option key={d.country} value={d.code}>
          {d.flag} {d.code}
        </option>
      ))}
    </select>
    <input
      type="tel"
      className={`${styles.fi} ${styles.phoneInput} ${errors.phone ? styles.fiError : ''}`}
      value={fields.phone}
      onChange={set('phone')}
      onBlur={() => blurCheck('phone')}
      placeholder="Phone number"
    />
  </div>
  {(errors.phoneCode || errors.phone) && (
    <span className={styles.fieldError}>
      {errors.phoneCode ? ERROR_MESSAGES.phoneCode : ERROR_MESSAGES.phone}
    </span>
  )}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Apply.jsx
git commit -m "feat: add phone field UI to Step 2"
```

---

### Task 6: Update Apply.jsx — Step 3 review summary

**Files:**
- Modify: `src/pages/Apply.jsx`

- [ ] **Step 1: Add Phone row to the review grid**

In [Apply.jsx](src/pages/Apply.jsx), find the review grid in Step 3 (around line 771). It currently starts with:

```jsx
<div className={styles.reviewItem}><span>Name</span><strong>{fields.first} {fields.last}</strong></div>
<div className={styles.reviewItem}><span>Email</span><strong>{fields.email}</strong></div>
```

Add a Phone row immediately after the Email row:

```jsx
<div className={styles.reviewItem}><span>Name</span><strong>{fields.first} {fields.last}</strong></div>
<div className={styles.reviewItem}><span>Email</span><strong>{fields.email}</strong></div>
<div className={styles.reviewItem}><span>Phone</span><strong>{fields.phoneCode} {fields.phone}</strong></div>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Apply.jsx
git commit -m "feat: show phone in Step 3 review summary"
```

---

### Task 7: Update applications.js — database insert and admin email

**Files:**
- Modify: `src/lib/applications.js`

- [ ] **Step 1: Add phone to the Supabase insert**

In [applications.js](src/lib/applications.js), find the `supabase.from('applications').insert` call (around line 121). Add `phone` to the insert object, after `email`:

```js
const { error } = await supabase
  .from('applications')
  .insert([{
    id: applicationId,
    first_name: fields.first,
    last_name: fields.last,
    email: fields.email,
    phone: fields.phoneCode && fields.phone
      ? fields.phoneCode + fields.phone.replace(/\D/g, '')
      : null,
    address: fields.address,
    city: fields.city,
    state: fields.state,
    zip: fields.zip,
    country: fields.country,
    linkedin: fields.linkedin,
    lang1: fields.lang1,
    lang2: fields.lang2,
    job_id: job.id,
    job_title: job.title,
    job_dept: job.dept,
    job_type: job.type,
    dob: fields.dob || null,
    cv_path: cvPath,
    cv_filename: cvFilename,
    id_path: idPath,
    id_filename: idFilename,
    id_back_path: idBackPath,
    id_back_filename: idBackFilename,
    id_type: idType || null,
    status: 'applied',
  }])
```

- [ ] **Step 2: Add phone row to admin notification email**

In [applications.js](src/lib/applications.js), find the admin email HTML table (around line 213). It currently has rows for Name, Email, Role, Department, Country, LinkedIn, CV. Add a Phone row after the Email row:

```js
<tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;width:42%;border-bottom:1px solid #F5F0EB;">Name</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${fields.first} ${fields.last}</td></tr>
<tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Email</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${fields.email}</td></tr>
<tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Phone</td><td style="padding:10px 0;font-size:13px;color:#1A1410;font-weight:600;border-bottom:1px solid #F5F0EB;">${fields.phoneCode || ''}${fields.phone ? fields.phone.replace(/\D/g, '') : '—'}</td></tr>
<tr><td style="padding:10px 0;font-size:13px;color:#9a8f85;border-bottom:1px solid #F5F0EB;">Role</td>...
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/applications.js
git commit -m "feat: store phone in applications table and surface in admin email"
```

---

### Task 8: SQL migration

**Files:** none — this is a manual step in the Supabase dashboard.

- [ ] **Step 1: Run the following SQL in your Supabase project's SQL editor**

Log in to Supabase → SQL Editor → New query → paste and run:

```sql
ALTER TABLE applications ADD COLUMN phone text;
```

Expected: success message. The `applications` table now has a `phone` column that accepts null (for any existing rows) or a text value for new rows.

---

### Task 9: Smoke test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Navigate to any job application form**

Go to `http://localhost:5173/jobs`, click a role, click Apply.

- [ ] **Step 3: Verify Step 1 completes normally (no phone yet)**

Upload an ID, click Continue — should advance to Step 2.

- [ ] **Step 4: Verify phone field appears in Step 2**

Below Email Address there should be a "Phone Number *" label with a dial code dropdown (flag + code) and a number input side by side.

- [ ] **Step 5: Test auto-select**

Select a country in the Location section (e.g. United Kingdom). Scroll back up — the dial code dropdown should now show 🇬🇧 +44 automatically.

- [ ] **Step 6: Test validation — click Continue without phone**

Click Continue with the phone field empty. Should see "Please select a country dial code" if no code selected, or "Enter a valid phone number" if code is selected but number is empty.

- [ ] **Step 7: Test validation — enter gibberish**

Select 🇬🇧 +44, type `12345` in the number field, click Continue. Should show "Enter a valid phone number".

- [ ] **Step 8: Test validation — enter a valid number**

Type `7911123456` (a valid UK mobile). Error should clear and Continue should proceed to Step 3.

- [ ] **Step 9: Verify phone shows in review**

In Step 3, the review box should contain a "Phone" row showing `+44 7911123456`.

- [ ] **Step 10: Submit and verify Supabase row**

Complete and submit the application. In Supabase Table Editor → `applications` → find the new row. The `phone` column should contain `+447911123456` (no spaces).
