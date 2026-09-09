// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import { consumeAccessTokenFragment } from './fragment-token';

const STORAGE_KEY = 'wg_access_token';

function visit(url: string): void {
  window.history.replaceState({}, '', url);
}

describe('consumeAccessTokenFragment', () => {
  beforeEach(() => {
    window.localStorage.clear();
    visit('/');
  });

  it('stores the session a redirect handed back in the fragment', () => {
    // This is what a magic link lands on: the BFF verified the token, created
    // the session, and could not set a cookie for this origin.
    visit('/#access_token=sess-123');

    expect(consumeAccessTokenFragment()).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('sess-123');
  });

  it('scrubs the token from the address bar so a reload does not resend it', () => {
    visit('/welcome?ref=email#access_token=sess-123');

    consumeAccessTokenFragment();

    expect(window.location.pathname).toBe('/welcome');
    expect(window.location.search).toBe('?ref=email');
    expect(window.location.hash).toBe('');
  });

  it('keeps the rest of the fragment', () => {
    visit('/#access_token=sess-123&tab=profile');

    consumeAccessTokenFragment();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('sess-123');
    expect(window.location.hash).toBe('#tab=profile');
  });

  it('leaves a hash-router path untouched', () => {
    // `#/settings` parses as a parameter named "/settings" with no value.
    // Rewriting the URL here would break navigation in hash-routed apps.
    visit('/#/settings');

    expect(consumeAccessTokenFragment()).toBe(false);
    expect(window.location.hash).toBe('#/settings');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('does nothing on a plain page load', () => {
    visit('/dashboard');

    expect(consumeAccessTokenFragment()).toBe(false);
    expect(window.location.pathname).toBe('/dashboard');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('ignores a fragment that carries no token', () => {
    visit('/#state=abc');

    expect(consumeAccessTokenFragment()).toBe(false);
    expect(window.location.hash).toBe('#state=abc');
  });
});
