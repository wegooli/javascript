import { useCallback, useEffect, useState } from 'react';
import { bffClient } from '../api/bff-client';

// Browser-side WebAuthn JSON shapes are mostly opaque to us — go-webauthn on
// the server expects them echoed back as-is. Keeping the typing loose lets us
// avoid pulling in the verbose `lib.dom` WebAuthn types here.
type CredentialCreationOptions = unknown;
type CredentialAssertionOptions = unknown;
type WebAuthnSessionData = unknown;

export interface PasskeyCredential {
  id: string;
  userId: string;
  userKind: 'platform' | 'tenant';
  organizationId?: string;
  credentialId: string;
  aaguid?: string;
  signCount: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface UsePasskeyReturn {
  isLoading: boolean;
  error: Error | null;

  /** Discoverable login. Browser shows the OS credential picker. */
  signInWithPasskey: () => Promise<void>;

  /** Enroll a passkey for the currently signed-in user. */
  registerPasskey: (displayName?: string) => Promise<void>;

  /** Manage devices. */
  listCredentials: () => Promise<PasskeyCredential[]>;
  deleteCredential: (credentialId: string) => Promise<void>;

  /** True if the browser ships WebAuthn — caller hides the button when false. */
  isAvailable: boolean;
}

export function usePasskey(): UsePasskeyReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Resolve WebAuthn availability *after* mount so the first client render
  // matches the server (always `false`). Otherwise the SignIn UI gates the
  // Passkey button on a value that differs between SSR and CSR, which
  // produces a Next.js hydration mismatch error.
  const [isAvailable, setIsAvailable] = useState(false);
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.PublicKeyCredential !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      typeof navigator.credentials?.create === 'function'
    ) {
      setIsAvailable(true);
    }
  }, []);

  const wrap = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithPasskey = useCallback(
    () =>
      wrap(async () => {
        if (!isAvailable) throw new Error('WebAuthn not available in this browser');
        const begin = await bffClient.post<{
          options: { publicKey: CredentialAssertionOptions };
          sessionData: WebAuthnSessionData;
        }>('/api/auth/webauthn/auth/begin', {});

        const publicKey = decodeAssertionOptions(begin.options.publicKey);
        const cred = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
        if (!cred) throw new Error('Passkey assertion was cancelled');

        const credJSON = encodeAssertion(cred);
        const finish = await bffClient.post<{ status: string; redirectUrl?: string }>(
          '/api/auth/webauthn/auth/finish',
          { sessionData: begin.sessionData, credential: credJSON },
        );
        if (typeof window !== 'undefined' && finish.redirectUrl) {
          window.location.href = finish.redirectUrl;
        }
      }),
    [isAvailable, wrap],
  );

  const registerPasskey = useCallback(
    (displayName?: string) =>
      wrap(async () => {
        if (!isAvailable) throw new Error('WebAuthn not available in this browser');
        const begin = await bffClient.post<{
          options: { publicKey: CredentialCreationOptions };
          sessionData: WebAuthnSessionData;
        }>('/api/auth/webauthn/register/begin', { displayName });

        const publicKey = decodeCreationOptions(begin.options.publicKey);
        const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
        if (!cred) throw new Error('Passkey creation was cancelled');

        const credJSON = encodeAttestation(cred);
        await bffClient.post('/api/auth/webauthn/register/finish', {
          sessionData: begin.sessionData,
          credential: credJSON,
        });
      }),
    [isAvailable, wrap],
  );

  const listCredentials = useCallback(
    () =>
      wrap(async () => {
        const r = await bffClient.get<{ credentials: PasskeyCredential[] }>('/api/auth/webauthn/credentials');
        return r.credentials ?? [];
      }),
    [wrap],
  );

  const deleteCredential = useCallback(
    (credentialId: string) =>
      wrap(async () => {
        await bffClient.delete(`/api/auth/webauthn/credentials/${encodeURIComponent(credentialId)}`);
      }),
    [wrap],
  );

  return {
    isLoading,
    error,
    isAvailable,
    signInWithPasskey,
    registerPasskey,
    listCredentials,
    deleteCredential,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WebAuthn JSON ↔ ArrayBuffer adapters. The server returns base64url-encoded
// challenge / id / userHandle fields (because JSON can't carry ArrayBuffers).
// The browser API needs ArrayBuffers. We do the conversion in both directions
// here so the rest of the SDK stays buffer-free.
// ───────────────────────────────────────────────────────────────────────────

function b64urlToBuffer(b64url: string): ArrayBuffer {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(b64url.length + ((4 - (b64url.length % 4)) % 4), '=');
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function bufferToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

interface AssertionOptionsJSON {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: Array<{ id: string; type: string; transports?: string[] }>;
  userVerification?: string;
  extensions?: unknown;
}

function decodeAssertionOptions(o: unknown): PublicKeyCredentialRequestOptions {
  const j = o as AssertionOptionsJSON;
  return {
    challenge: b64urlToBuffer(j.challenge),
    timeout: j.timeout,
    rpId: j.rpId,
    userVerification: j.userVerification as AuthenticatorSelectionCriteria['userVerification'],
    allowCredentials: (j.allowCredentials ?? []).map((c) => ({
      id: b64urlToBuffer(c.id),
      type: c.type as PublicKeyCredentialType,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
  };
}

interface CreationOptionsJSON {
  challenge: string;
  rp: { id?: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  timeout?: number;
  excludeCredentials?: Array<{ id: string; type: string; transports?: string[] }>;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
  extensions?: unknown;
}

function decodeCreationOptions(o: unknown): PublicKeyCredentialCreationOptions {
  const j = o as CreationOptionsJSON;
  return {
    challenge: b64urlToBuffer(j.challenge),
    rp: j.rp,
    user: {
      id: b64urlToBuffer(j.user.id),
      name: j.user.name,
      displayName: j.user.displayName,
    },
    pubKeyCredParams: j.pubKeyCredParams as PublicKeyCredentialParameters[],
    timeout: j.timeout,
    excludeCredentials: (j.excludeCredentials ?? []).map((c) => ({
      id: b64urlToBuffer(c.id),
      type: c.type as PublicKeyCredentialType,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
    authenticatorSelection: j.authenticatorSelection,
    attestation: j.attestation,
  };
}

function encodeAttestation(cred: PublicKeyCredential): unknown {
  const r = cred.response as AuthenticatorAttestationResponse;
  return {
    id: cred.id,
    rawId: bufferToB64url(cred.rawId),
    type: cred.type,
    response: {
      clientDataJSON: bufferToB64url(r.clientDataJSON),
      attestationObject: bufferToB64url(r.attestationObject),
    },
    clientExtensionResults: cred.getClientExtensionResults?.() ?? {},
  };
}

function encodeAssertion(cred: PublicKeyCredential): unknown {
  const r = cred.response as AuthenticatorAssertionResponse;
  return {
    id: cred.id,
    rawId: bufferToB64url(cred.rawId),
    type: cred.type,
    response: {
      clientDataJSON: bufferToB64url(r.clientDataJSON),
      authenticatorData: bufferToB64url(r.authenticatorData),
      signature: bufferToB64url(r.signature),
      userHandle: r.userHandle ? bufferToB64url(r.userHandle) : undefined,
    },
    clientExtensionResults: cred.getClientExtensionResults?.() ?? {},
  };
}
