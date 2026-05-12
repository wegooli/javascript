import React, { useState } from 'react';
import type { AppearanceConfig } from '../../types/appearance';
import { useOrganization } from '@wegooli/identity-react';

export interface OrganizationSwitcherProps {
  appearance?: AppearanceConfig;
  onSwitch?: (orgId: string) => void;
}

export function OrganizationSwitcher({
  appearance,
  onSwitch,
}: OrganizationSwitcherProps): React.ReactElement {
  const { organization, isLoaded } = useOrganization();
  const [open, setOpen] = useState(false);

  const primaryColor = appearance?.variables?.colorPrimary ?? '#6366f1';

  if (!isLoaded) {
    return <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />;
  }

  if (!organization) {
    return <span className="text-sm text-gray-400">No organization</span>;
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {organization.logoUrl ? (
          <img src={organization.logoUrl} alt={organization.displayName} className="h-5 w-5 rounded" />
        ) : (
          <span
            className="h-5 w-5 rounded flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: organization.primaryColor ?? primaryColor }}
          >
            {organization.displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span>{organization.displayName}</span>
        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow-lg z-10">
          <ul role="listbox">
            <li
              role="option"
              aria-selected={true}
              className="px-4 py-2 text-sm text-gray-900 bg-indigo-50 cursor-default"
            >
              {organization.displayName}
            </li>
          </ul>
          {onSwitch && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                className="w-full text-left text-sm text-gray-600 px-2 py-1 hover:bg-gray-50 rounded"
                onClick={() => {
                  onSwitch(organization.id);
                  setOpen(false);
                }}
              >
                Switch organization…
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
