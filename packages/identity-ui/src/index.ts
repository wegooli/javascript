// 내보내는 컴포넌트는 모두 스코프로 감싼다. dist/styles.css 가
// `.wg-identity` 후손으로 한정돼 있어, 이 래퍼가 없으면 스타일이 붙지 않는다.
// 자세한 이유는 scope.tsx 주석 참고.
import { withIdentityScope } from './scope';

// Components
import { SignIn as SignInBase } from './components/SignIn/SignIn';
export const SignIn = withIdentityScope(SignInBase, 'SignIn');
export type { SignInProps } from './components/SignIn/SignIn';

import { SignUp as SignUpBase } from './components/SignUp/SignUp';
export const SignUp = withIdentityScope(SignUpBase, 'SignUp');
export type { SignUpProps } from './components/SignUp/SignUp';

import { AuthLayout as AuthLayoutBase } from './components/AuthLayout/AuthLayout';
export const AuthLayout = withIdentityScope(AuthLayoutBase, 'AuthLayout');
export type { AuthLayoutProps } from './components/AuthLayout/AuthLayout';

import { UserProfile as UserProfileBase } from './components/UserProfile/UserProfile';
export const UserProfile = withIdentityScope(UserProfileBase, 'UserProfile');
export type { UserProfileProps } from './components/UserProfile/UserProfile';

import { OrganizationSwitcher as OrganizationSwitcherBase } from './components/OrganizationSwitcher/OrganizationSwitcher';
export const OrganizationSwitcher = withIdentityScope(OrganizationSwitcherBase, 'OrganizationSwitcher');
export type { OrganizationSwitcherProps } from './components/OrganizationSwitcher/OrganizationSwitcher';

import { OrganizationProfile as OrganizationProfileBase } from './components/OrganizationProfile/OrganizationProfile';
export const OrganizationProfile = withIdentityScope(OrganizationProfileBase, 'OrganizationProfile');
export type { OrganizationProfileProps } from './components/OrganizationProfile/OrganizationProfile';

import { MFAChallenge as MFAChallengeBase } from './components/MFAChallenge/MFAChallenge';
export const MFAChallenge = withIdentityScope(MFAChallengeBase, 'MFAChallenge');
export type { MFAChallengeProps } from './components/MFAChallenge/MFAChallenge';

import { MFAEnroll as MFAEnrollBase } from './components/MFAEnroll/MFAEnroll';
export const MFAEnroll = withIdentityScope(MFAEnrollBase, 'MFAEnroll');
export type { MFAEnrollProps } from './components/MFAEnroll/MFAEnroll';

import { PasskeyManager as PasskeyManagerBase } from './components/PasskeyManager/PasskeyManager';
export const PasskeyManager = withIdentityScope(PasskeyManagerBase, 'PasskeyManager');
export type { PasskeyManagerProps } from './components/PasskeyManager/PasskeyManager';

import { ProfileManager as ProfileManagerBase } from './components/ProfileManager/ProfileManager';
export const ProfileManager = withIdentityScope(ProfileManagerBase, 'ProfileManager');
export type { ProfileManagerProps } from './components/ProfileManager/ProfileManager';

// Primitives — exported for direct consumption alongside SignIn/SignUp
import { Button as ButtonBase } from './primitives/Button';
export const Button = withIdentityScope(ButtonBase, 'Button');
export type { ButtonProps } from './primitives/Button';

import { Input as InputBase } from './primitives/Input';
export const Input = withIdentityScope(InputBase, 'Input');
export type { InputProps } from './primitives/Input';

import { Card as CardBase } from './primitives/Card';
export const Card = withIdentityScope(CardBase, 'Card');
export type { CardProps } from './primitives/Card';

import { Divider as DividerBase } from './primitives/Divider';
export const Divider = withIdentityScope(DividerBase, 'Divider');
export type { DividerProps } from './primitives/Divider';

import { SocialButton as SocialButtonBase } from './primitives/SocialButton';
export const SocialButton = withIdentityScope(SocialButtonBase, 'SocialButton');
export type { SocialButtonProps } from './primitives/SocialButton';

export { ArrowRightIcon, GithubIcon, GoogleIcon, ProviderInitialIcon } from './primitives/icons';

// 스코프를 직접 쓰고 싶을 때 (예: 라이브러리 컴포넌트를 감싼 자체 래퍼)
export { IdentityScope, IDENTITY_SCOPE_CLASS } from './scope';

// Types
export type { AppearanceConfig, AppearanceVariables, AppearanceElements } from './types/appearance';
