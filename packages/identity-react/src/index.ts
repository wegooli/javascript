'use client';

// Context
export { ZitadelContext, useZitadelContext } from './context/ZitadelContext';
export type { ZitadelContextValue } from './context/ZitadelContext';

// Providers
export { ZitadelProvider } from './provider/ZitadelProvider';
export type { ZitadelProviderProps, AppearanceConfig } from './provider/ZitadelProvider';
export { MockProvider, AutoProvider } from './provider/MockProvider';
export type { MockProviderProps } from './provider/MockProvider';

// Hooks
export { useAuth } from './hooks/useAuth';
export type { UseAuthReturn } from './hooks/useAuth';

export { useUser } from './hooks/useUser';
export type { UseUserReturn } from './hooks/useUser';

export { useOrganization } from './hooks/useOrganization';
export type { UseOrganizationReturn } from './hooks/useOrganization';

export { useSignIn } from './hooks/useSignIn';
export type { UseSignInReturn } from './hooks/useSignIn';

export { useSignUp } from './hooks/useSignUp';
export type { UseSignUpReturn } from './hooks/useSignUp';

export { useEmailOTP } from './hooks/useEmailOTP';
export type { UseEmailOTPReturn } from './hooks/useEmailOTP';

export { useMagicLink } from './hooks/useMagicLink';
export type { UseMagicLinkReturn } from './hooks/useMagicLink';

export { useMFA } from './hooks/useMFA';
export type { UseMFAReturn, MFAFactor } from './hooks/useMFA';

export { usePasskey } from './hooks/usePasskey';
export type { UsePasskeyReturn, PasskeyCredential } from './hooks/usePasskey';

export { usePhoneOTP } from './hooks/usePhoneOTP';
export type { UsePhoneOTPReturn } from './hooks/usePhoneOTP';

export { useProfile } from './hooks/useProfile';
export type { UseProfileReturn, ProfileIdentifiers, ProfileIdentifierKind } from './hooks/useProfile';

// BFF client (lower-level, for advanced use)
export { bffClient, configureBffClient, readBffBaseUrl, readPublishableKey } from './api/bff-client';
