// Unit — the axios error normaliser every screen uses for its failure copy
// (SRS NFR-9 friendly error messages).

import { describe, test, expect } from 'vitest';
import { errorMessage } from '../../src/services/api';

// The friendly default owned by src/services/api.js.
const FALLBACK = 'Something went wrong. Please try again.';

describe('errorMessage', () => {
  test('prefers the server-provided message', () => {
    expect(errorMessage({ response: { data: { message: 'Place name is taken.' } } })).toBe(
      'Place name is taken.'
    );
  });

  test('falls back to the axios error message when the body has none', () => {
    expect(errorMessage(new Error('Network Error'))).toBe('Network Error');
  });

  test('falls back to a friendly default for anything unrecognised', () => {
    expect(errorMessage({})).toBe(FALLBACK);
    expect(errorMessage({ response: {} })).toBe(FALLBACK);
    expect(errorMessage(undefined)).toBe(FALLBACK);
    expect(errorMessage(null)).toBe(FALLBACK);
  });

  test('an HTTP error with a plain (non-JSON) body still reads well', () => {
    expect(errorMessage({ response: { data: 'Internal Server Error' } })).toBe(FALLBACK);
  });
});
