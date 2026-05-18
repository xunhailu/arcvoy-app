# Phone Number Field — Design Spec
Date: 2026-05-17

## Summary
Add a mandatory, validated international phone number field to Step 2 (Your Details) of the job application form. The field consists of a dial code selector and a number input. Validation is performed client-side using libphonenumber-js, which knows the exact format rules for every country.

---

## Field Placement
Step 2 — Personal Information section, immediately below the Email Address field.

---

## UI Components

**Layout:** Two-column inline row.
- Left (narrow ~130px): Dial code dropdown — shows flag emoji + dial code (e.g. 🇬🇧 +44). Styled to match existing form inputs.
- Right (flex-grow): Number input — placeholder "Phone number", type="tel".

**Auto-select:** When the applicant selects a country in the Location section, the dial code pre-selects to that country's code. If "Other" is selected, dial code resets to blank and the applicant must choose manually.

**Supported dial codes** (mirrors the 19 platform countries):

| Country | ISO | Dial |
|---|---|---|
| United States | US | +1 |
| United Kingdom | GB | +44 |
| Canada | CA | +1 |
| Australia | AU | +61 |
| Germany | DE | +49 |
| France | FR | +33 |
| China | CN | +86 |
| India | IN | +91 |
| Nigeria | NG | +234 |
| Brazil | BR | +55 |
| Japan | JP | +81 |
| Italy | IT | +39 |
| Spain | ES | +34 |
| Netherlands | NL | +31 |
| Sweden | SE | +46 |
| Turkey | TR | +90 |
| Poland | PL | +48 |
| Denmark | DK | +45 |
| Singapore | SG | +65 |

---

## Validation

**Library:** `libphonenumber-js` (npm) — Google's phone number library. Knows exact format rules (length, prefix, range) for every country.

**Validation logic:**
1. Require both dial code and number to be non-empty.
2. Combine as `{dialCode}{number}` (e.g. `+447911123456`) and call `isValidPhoneNumber(combined)`.
3. If invalid → show error "Enter a valid phone number".
4. Triggered on blur (inline) and on "Continue" button press.

**"Other" country:** When no ISO code is known, fall back to basic sanity check — strip non-digits, require 5–15 characters (ITU-T E.164 range). This catches all gibberish without rejecting legitimate exotic numbers.

**Stored format:** Full international string, e.g. `+447911123456`. No spaces or formatting.

---

## State Changes (Apply.jsx)

New fields in `fields` state:
- `phoneCode`: string, e.g. `"+44"` — the selected dial code
- `phone`: string — the number digits entered by the applicant

Auto-select side effect: when `fields.country` changes, look up matching `phoneCode` from the DIAL_CODES map and update `fields.phoneCode`. If country is "Other" or unmapped, set `phoneCode` to `""`.

---

## Error Messages
```
phone: 'Enter a valid phone number'
phoneCode: 'Please select a dial code'
```

---

## Review Summary (Step 3)
Add a "Phone" row to the review grid showing `{phoneCode} {phone}`.

---

## Database
New column required:
```sql
ALTER TABLE applications ADD COLUMN phone text;
```

The `submitApplication` function inserts `phone: \`${fields.phoneCode}${fields.phone}\`` (full international format).

---

## Admin Email
Add a "Phone" row to the admin notification email table, between Email and Role rows.

---

## Out of Scope
- OTP / SMS verification (adds friction and cost; unnecessary for an application form)
- AI edge function (libphonenumber is more accurate and instant)
- CV auto-fill of phone number (CV parsing does not reliably extract phone numbers)
