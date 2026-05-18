import { isValidPhoneNumber } from 'libphonenumber-js'

export const DIAL_CODES = [
  { country: 'United States', iso: 'US', code: '+1',   flag: '🇺🇸' },
  { country: 'United Kingdom',iso: 'GB', code: '+44',  flag: '🇬🇧' },
  { country: 'Canada',        iso: 'CA', code: '+1',   flag: '🇨🇦' },
  { country: 'Mexico',        iso: 'MX', code: '+52',  flag: '🇲🇽' },
  { country: 'Japan',         iso: 'JP', code: '+81',  flag: '🇯🇵' },
  { country: 'Germany',       iso: 'DE', code: '+49',  flag: '🇩🇪' },
  { country: 'France',        iso: 'FR', code: '+33',  flag: '🇫🇷' },
  { country: 'Italy',         iso: 'IT', code: '+39',  flag: '🇮🇹' },
  { country: 'Nigeria',       iso: 'NG', code: '+234', flag: '🇳🇬' },
  { country: 'Thailand',      iso: 'TH', code: '+66',  flag: '🇹🇭' },
  { country: 'Taiwan',        iso: 'TW', code: '+886', flag: '🇹🇼' },
  { country: 'Poland',        iso: 'PL', code: '+48',  flag: '🇵🇱' },
  { country: 'Colombia',      iso: 'CO', code: '+57',  flag: '🇨🇴' },
  { country: 'Denmark',       iso: 'DK', code: '+45',  flag: '🇩🇰' },
  { country: 'Sweden',        iso: 'SE', code: '+46',  flag: '🇸🇪' },
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
