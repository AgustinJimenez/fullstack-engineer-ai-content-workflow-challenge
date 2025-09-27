import { cn } from '../utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('base-class', 'additional-class')).toBe('base-class additional-class')
    })

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class', false && 'hidden-class'))
        .toBe('base-class conditional-class')
    })

    it('should handle undefined and null values', () => {
      expect(cn('base-class', undefined, null, 'final-class'))
        .toBe('base-class final-class')
    })

    it('should merge Tailwind classes with conflicts', () => {
      // tailwind-merge should handle conflicting classes
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3'))
        .toBe('class1 class2 class3')
    })

    it('should handle empty input', () => {
      expect(cn()).toBe('')
    })
  })
})