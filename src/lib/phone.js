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
