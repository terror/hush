import { describe, expect, it } from 'bun:test';

import { cn } from '../lib/utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    const result = cn('btn', 'btn-primary', 'text-white');
    expect(result).toContain('btn');
    expect(result).toContain('btn-primary');
    expect(result).toContain('text-white');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;

    const result = cn('btn', isActive && 'active', isDisabled && 'disabled');

    expect(result).toContain('btn');
    expect(result).toContain('active');
    expect(result).not.toContain('disabled');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle null and undefined values', () => {
    const result = cn('btn', null, undefined, 'primary');
    expect(result).toContain('btn');
    expect(result).toContain('primary');
    expect(result).not.toContain('null');
    expect(result).not.toContain('undefined');
  });

  it('should handle arrays of class names', () => {
    const result = cn(['btn', 'btn-lg'], 'primary');
    expect(result).toContain('btn');
    expect(result).toContain('btn-lg');
    expect(result).toContain('primary');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      btn: true,
      'btn-primary': true,
      'btn-disabled': false,
      'btn-large': true,
    });

    expect(result).toContain('btn');
    expect(result).toContain('btn-primary');
    expect(result).toContain('btn-large');
    expect(result).not.toContain('btn-disabled');
  });

  it('should resolve Tailwind conflicts correctly', () => {
    const result = cn('p-4', 'p-6', 'text-sm', 'text-lg');

    expect(result).toContain('p-6');
    expect(result).not.toContain('p-4');
    expect(result).toContain('text-lg');
    expect(result).not.toContain('text-sm');
  });

  it('should handle complex mixed inputs', () => {
    const isActive = true;
    const isLarge = false;

    const result = cn(
      'btn',
      ['btn-primary', 'font-medium'],
      {
        active: isActive,
        large: isLarge,
      },
      isActive && 'focus:ring-2',
      'hover:bg-blue-600'
    );

    expect(result).toContain('btn');
    expect(result).toContain('btn-primary');
    expect(result).toContain('font-medium');
    expect(result).toContain('active');
    expect(result).toContain('focus:ring-2');
    expect(result).toContain('hover:bg-blue-600');
    expect(result).not.toContain('large');
  });

  it('should handle empty strings and whitespace', () => {
    const result = cn('', ' ', 'btn', '  ', 'primary');
    expect(result).toContain('btn');
    expect(result).toContain('primary');
  });

  it('should be deterministic with same inputs', () => {
    const classes = ['btn', 'btn-primary', { active: true, disabled: false }];
    const result1 = cn(...classes);
    const result2 = cn(...classes);
    expect(result1).toBe(result2);
  });
});
