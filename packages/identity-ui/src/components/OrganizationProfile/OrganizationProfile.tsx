import React from 'react';
import type { AppearanceConfig } from '../../types/appearance';
import { useOrganization } from '@wegooli/identity-react';

export interface OrganizationProfileProps {
  appearance?: AppearanceConfig;
}

export function OrganizationProfile({ appearance }: OrganizationProfileProps): React.ReactElement {
  const { organization, memberships, isLoaded } = useOrganization();

  const primaryColor = appearance?.variables?.colorPrimary ?? '#6366f1';
  const cardClass = [
    'w-full max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg',
    appearance?.elements?.card ?? '',
  ]
    .join(' ')
    .trim();

  if (!isLoaded) {
    return (
      <div className={cardClass}>
        <p className="text-gray-400 text-center">Loading…</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className={cardClass}>
        <p className="text-gray-600 text-center">No organization found.</p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {organization.logoUrl ? (
          <img
            src={organization.logoUrl}
            alt={organization.displayName}
            className="h-14 w-14 rounded-lg object-cover"
          />
        ) : (
          <div
            className="h-14 w-14 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: organization.primaryColor ?? primaryColor }}
          >
            {organization.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{organization.displayName}</h2>
          <p className="text-sm text-gray-500">/{organization.slug}</p>
        </div>
      </div>

      {/* Members */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Members ({memberships.length})
        </h3>
        {memberships.length === 0 ? (
          <p className="text-sm text-gray-400">No members loaded.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {memberships.map((member: import('@wegooli/identity-types').Member) => (
              <li key={member.userId} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.displayName}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <div className="flex gap-1">
                  {member.roles.map((role: string) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
