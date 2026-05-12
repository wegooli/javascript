import React from 'react';
import type { AppearanceConfig } from '../../types/appearance';
import { useUser, useAuth } from '@wegooli/identity-react';

export interface UserProfileProps {
  appearance?: AppearanceConfig;
}

export function UserProfile({ appearance }: UserProfileProps): React.ReactElement {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();

  const primaryColor = appearance?.variables?.colorPrimary ?? '#6366f1';
  const cardClass = ['w-full max-w-md mx-auto p-8 bg-white shadow-lg rounded-lg', appearance?.elements?.card ?? '']
    .join(' ')
    .trim();

  if (!isLoaded) {
    return (
      <div className={cardClass}>
        <p className="text-gray-400 text-center">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cardClass}>
        <p className="text-gray-600 text-center">Not signed in.</p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-4 mb-6">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
          style={{ backgroundColor: primaryColor }}
        >
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user.displayName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <dl className="space-y-2 text-sm mb-6">
        <div className="flex justify-between">
          <dt className="text-gray-500">User ID</dt>
          <dd className="font-mono text-gray-700">{user.id}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Roles</dt>
          <dd className="text-gray-700">{user.roles.join(', ')}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Member since</dt>
          <dd className="text-gray-700">{new Date(user.createdAt).toLocaleDateString()}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => void signOut()}
        className={[
          'w-full py-2 px-4 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50 transition-colors',
          appearance?.elements?.primaryButton ?? '',
        ].join(' ')}
      >
        Sign out
      </button>
    </div>
  );
}
