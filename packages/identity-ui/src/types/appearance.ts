export interface AppearanceVariables {
  /** Brand primary color (CSS color value) */
  colorPrimary?: string;
  /** Background color for card/modal surfaces */
  colorBackground?: string;
  /** Text color */
  colorText?: string;
  /** Danger/error color */
  colorDanger?: string;
  /** Input border radius */
  borderRadius?: string;
  /** Font family */
  fontFamily?: string;
  /** Base font size */
  fontSize?: string;
}

export interface AppearanceElements {
  /** Root container class overrides */
  rootBox?: string;
  /** Card wrapper class overrides */
  card?: string;
  /** Header section class overrides */
  header?: string;
  /** Logo image class overrides */
  logoImage?: string;
  /** Primary action button class overrides */
  primaryButton?: string;
  /** Social/OAuth button class overrides */
  socialButton?: string;
  /** Input field class overrides */
  formField?: string;
  /** Form field label class overrides */
  formFieldLabel?: string;
  /** Error message class overrides */
  formFieldError?: string;
  /** Footer section class overrides */
  footer?: string;
}

export interface AppearanceConfig {
  /** CSS variable overrides */
  variables?: AppearanceVariables;
  /** Tailwind class overrides for specific elements */
  elements?: AppearanceElements;
  /** URL for the organization logo displayed in the auth card */
  logoUrl?: string;
  /** Alt text for the logo */
  logoAlt?: string;
}
