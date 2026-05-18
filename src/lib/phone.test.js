import { describe, it, expect } from 'vitest'
import { DIAL_CODES, dialCodeForCountry, validatePhone } from './phone'

describe('DIAL_CODES', () => {
  it('contains entries for all platform countries', () => {
    const names = DIAL_CODES.map(d => d.country)
    expect(names).toContain('United States')
    expect(names).toContain('United Kingdom')
    expect(names).toContain('Nigeria')
    expect(names).toContain('Mexico')
    expect(names).toContain('Thailand')
    expect(names).toContain('Taiwan')
    expect(names).toContain('Colombia')
    expect(names).not.toContain('Other')
    expect(names).not.toContain('Singapore')
    expect(names).not.toContain('Australia')
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
  it('returns the dial code for known countries', () => {
    expect(dialCodeForCountry('United Kingdom')).toBe('+44')
    expect(dialCodeForCountry('Nigeria')).toBe('+234')
    expect(dialCodeForCountry('Japan')).toBe('+81')
    expect(dialCodeForCountry('United States')).toBe('+1')
    expect(dialCodeForCountry('Canada')).toBe('+1')
    expect(dialCodeForCountry('Mexico')).toBe('+52')
    expect(dialCodeForCountry('Thailand')).toBe('+66')
    expect(dialCodeForCountry('Taiwan')).toBe('+886')
    expect(dialCodeForCountry('Colombia')).toBe('+57')
  })

  it('returns empty string for unmapped values', () => {
    expect(dialCodeForCountry('Other')).toBe('')
    expect(dialCodeForCountry('')).toBe('')
    expect(dialCodeForCountry('Australia')).toBe('')
  })
})

describe('validatePhone', () => {
  it('accepts valid UK mobile number', () => {
    expect(validatePhone('+44', '7911123456')).toBe(true)
  })

  it('accepts valid Nigerian mobile number', () => {
    expect(validatePhone('+234', '8012345678')).toBe(true)
  })

  it('accepts valid US number', () => {
    expect(validatePhone('+1', '2025551234')).toBe(true)
  })

  it('strips spaces and dashes before validating', () => {
    expect(validatePhone('+44', '07911 123456')).toBe(true)
    expect(validatePhone('+1', '(202) 555-1234')).toBe(true)
  })

  it('rejects too-short numbers', () => {
    expect(validatePhone('+44', '123')).toBe(false)
    expect(validatePhone('+1', '555')).toBe(false)
  })

  it('rejects all-zero gibberish', () => {
    expect(validatePhone('+44', '00000000000')).toBe(false)
  })

  it('rejects empty or whitespace-only number', () => {
    expect(validatePhone('+44', '')).toBe(false)
    expect(validatePhone('+44', '   ')).toBe(false)
  })

  it('falls back to length check when no dial code', () => {
    expect(validatePhone('', '123456789')).toBe(true)
    expect(validatePhone('', '1234')).toBe(false)
    expect(validatePhone('', '1234567890123456')).toBe(false)
  })
})
