import type { AuthLabels } from './types';

/**
 * English copy — opt in with `locale="en"` (or the app's `branding.locale`).
 *
 * Kept in step with `ko.tsx`: same keys, same audience (the person signing in,
 * not the developer integrating the SDK). Errors say what to do next rather
 * than what failed internally.
 */
export const en: AuthLabels = {
  common: {
    divider: 'or',
    registeredDivider: 'Already registered',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    phoneLabel: 'Phone number',
    phonePlaceholder: '+82 10 1234 5678',
    emailTab: 'Email',
    phoneTab: 'Phone',
    submit: 'Continue',
    otpLabel: 'One-time code',
    otpPlaceholder: '123456',
    verifyOtp: 'Verify code',
    otpSentToEmail: (target) => <>Enter the one-time code we sent to {target}.</>,
    otpSentToPhone: (target) => <>Enter the one-time code we sent to {target}.</>,
    restartEmail: 'Use a different email',
    restartPhone: 'Use a different number',
    lastUsed: 'Last used',
  },

  signIn: {
    title: 'Sign in',
    passkey: 'Continue with passkey',
    continueWithProvider: (name) => `Continue with ${name}`,
    magicLinkSubmit: 'Email me a sign-in link',
    switchToMagicLink: 'Email me a sign-in link instead →',
    switchToOtp: '← Use a one-time code instead',
    magicLinkSent: (target) => <>Check your inbox — we sent a sign-in link to {target}.</>,
    magicLinkNote: 'The link expires in 15 minutes and can be used once.',
    magicLinkUseAnother: 'Use a different email',
  },

  signUp: {
    title: 'Create your account',
    passkey: 'Sign up with passkey',
    continueWithProvider: (name) => `Continue with ${name}`,
  },

  mfa: {
    title: 'Two-factor authentication',
    prompt: (target) =>
      target ? (
        <>Enter the 6-digit code from your authenticator app to finish signing in as {target}.</>
      ) : (
        <>Enter the 6-digit code from your authenticator app to finish signing in.</>
      ),
    codeLabel: 'Authentication code',
    submit: 'Verify',
  },

  errors: {
    fallback: 'Something went wrong. Please try again in a moment.',
    rateLimited: (seconds) => {
      if (!seconds || seconds < 1) return 'Too many attempts. Please try again in a moment.';
      if (seconds < 60) return `Too many attempts. Please try again in ${seconds} seconds.`;
      const minutes = Math.ceil(seconds / 60);
      if (minutes < 60) {
        return `Too many attempts. Please try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
      }
      const hours = Math.ceil(minutes / 60);
      return `Too many attempts. Please try again in ${hours} ${hours === 1 ? 'hour' : 'hours'}.`;
    },
    byCode: {
      invalid_email: "That email address doesn't look right. Please check it and try again.",
      invalid_phone: 'That phone number does not look right. Include the country code (+82).',
      invalid_body: 'Please check what you entered and try again.',
      verify_failed: 'That code is wrong or has expired. Request a new one.',
      unauthorized: "Those sign-in details didn't work. Please try again.",

      invalid_token: 'This link has already been used or has expired. Request a new one.',
      token_required: 'This link is incomplete. Open the link from your email again.',
      org_mismatch: 'This link was sent by a different service. Please sign in from this screen.',

      webauthn_unavailable: "This browser can't use passkeys. Sign in with your email instead.",
      passkey_cancelled: 'Passkey check was cancelled. Try again or sign in with your email.',
      passkey_not_allowed: "Passkeys aren't available here. Sign in with your email instead.",
      passkey_duplicate: 'A passkey is already registered on this device.',
      passkey_insecure_context: 'Passkeys only work over a secure (https) connection.',
      invalid_credential: "We couldn't verify that passkey. Please try again.",

      send_failed: "We couldn't send that. Please try again in a moment.",
      create_failed: "We couldn't create the sign-in link. Please try again in a moment.",
      session_failed: "We couldn't finish signing you in. Please try again in a moment.",
      auth_failed: "We couldn't finish signing you in. Please try again in a moment.",
      begin_failed: "We couldn't start signing you in. Please try again in a moment.",
      register_failed: "We couldn't complete registration. Please try again in a moment.",
      network_error: "We couldn't reach the server. Check your connection and try again.",
      session_expired: 'Your session ended. Please sign in again.',
      crypto_unavailable: "This browser can't start sign-in. Please use an up-to-date browser.",

      publishable_key_required: "This app's sign-in setup is incomplete. Please let the site owner know.",
      redirect_not_allowed: 'That return address is not allowed. Please let the site owner know.',
      invalid_session_data: 'The sign-in was interrupted. Please start again.',
    },
  },
};
