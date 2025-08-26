// apps/api/tests/quota.test.ts
import { describe, it, expect } from 'vitest'
import { MONTHLY_LIMITS, PER_KEYWORD_CAP, startOfBillingPeriod, getCurrentBillingPeriod } from '../src/lib/quota'

describe('Quota System - Ads Based', () => {
  describe('Constants', () => {
    it('should have correct monthly limits', () => {
      expect(MONTHLY_LIMITS.free).toBe(null)
      expect(MONTHLY_LIMITS.pro).toBe(500)
      expect(MONTHLY_LIMITS.enterprise).toBe(2000)
    })

    it('should have correct per-keyword caps', () => {
      expect(PER_KEYWORD_CAP.free).toBe(10)
      expect(PER_KEYWORD_CAP.pro).toBe(null)
      expect(PER_KEYWORD_CAP.enterprise).toBe(null)
    })
  })

  describe('Billing Period Functions', () => {
    it('should calculate start of billing period correctly', () => {
      const date = new Date('2025-01-15T10:30:00Z')
      const start = startOfBillingPeriod(date)
      expect(start.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    })

    it('should get current billing period in YYYY-MM format', () => {
      const period = getCurrentBillingPeriod()
      expect(period).toMatch(/^\d{4}-\d{2}$/)
    })
  })

  describe('Plan Behavior', () => {
    it('should allow free users unlimited keywords with 10-ad cap', () => {
      // Free users can run as many keywords as they want
      // but each keyword is capped to 10 ads
      expect(PER_KEYWORD_CAP.free).toBe(10)
      expect(MONTHLY_LIMITS.free).toBe(null)
    })

    it('should enforce monthly limits for pro users', () => {
      expect(MONTHLY_LIMITS.pro).toBe(500)
      expect(PER_KEYWORD_CAP.pro).toBe(null)
    })

    it('should enforce monthly limits for enterprise users', () => {
      expect(MONTHLY_LIMITS.enterprise).toBe(2000)
      expect(PER_KEYWORD_CAP.enterprise).toBe(null)
    })
  })
}) 