// Components
export { SignIn } from './components/SignIn/SignIn';
export type { SignInProps } from './components/SignIn/SignIn';

export { SignUp } from './components/SignUp/SignUp';
export type { SignUpProps } from './components/SignUp/SignUp';

export { AuthLayout } from './components/AuthLayout/AuthLayout';
export type { AuthLayoutProps } from './components/AuthLayout/AuthLayout';

export { UserProfile } from './components/UserProfile/UserProfile';
export type { UserProfileProps } from './components/UserProfile/UserProfile';

export { OrganizationSwitcher } from './components/OrganizationSwitcher/OrganizationSwitcher';
export type { OrganizationSwitcherProps } from './components/OrganizationSwitcher/OrganizationSwitcher';

export { OrganizationProfile } from './components/OrganizationProfile/OrganizationProfile';
export type { OrganizationProfileProps } from './components/OrganizationProfile/OrganizationProfile';

export { MFAChallenge } from './components/MFAChallenge/MFAChallenge';
export type { MFAChallengeProps } from './components/MFAChallenge/MFAChallenge';

export { MFAEnroll } from './components/MFAEnroll/MFAEnroll';
export type { MFAEnrollProps } from './components/MFAEnroll/MFAEnroll';

export { PasskeyManager } from './components/PasskeyManager/PasskeyManager';
export type { PasskeyManagerProps } from './components/PasskeyManager/PasskeyManager';

export { ProfileManager } from './components/ProfileManager/ProfileManager';
export type { ProfileManagerProps } from './components/ProfileManager/ProfileManager';

// Primitives — exported for direct consumption alongside SignIn/SignUp
export { Button, type ButtonProps } from './primitives/Button';
export { Input, type InputProps } from './primitives/Input';
export { Card, type CardProps } from './primitives/Card';
export { Divider, type DividerProps } from './primitives/Divider';
export { SocialButton, type SocialButtonProps } from './primitives/SocialButton';
export { ArrowRightIcon, GithubIcon, GoogleIcon, ProviderInitialIcon } from './primitives/icons';

// Types
export type { AppearanceConfig, AppearanceVariables, AppearanceElements } from './types/appearance';
