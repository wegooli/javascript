import { useState, useEffect } from 'react';
import type { Organization, Member, OrganizationMembersResponse } from '@wegooli/identity-types';
import { useZitadelContext } from '../context/ZitadelContext';
import { bffClient } from '../api/bff-client';

export interface UseOrganizationReturn {
  organization: Organization | null;
  memberships: Member[];
  isLoaded: boolean;
}

/**
 * Returns the current organization and its member list.
 * Fetches members from /api/org/members when the session is active.
 *
 * @throws {Error} if used outside of a ZitadelProvider
 */
export function useOrganization(): UseOrganizationReturn {
  const ctx = useZitadelContext();
  const [memberships, setMemberships] = useState<Member[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!ctx.isLoaded || !ctx.isSignedIn || !ctx.organization) {
      setIsLoaded(ctx.isLoaded);
      return;
    }

    bffClient
      .get<OrganizationMembersResponse>('/api/org/members')
      .then((data) => {
        setMemberships(data.members);
      })
      .catch(() => {
        setMemberships([]);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, [ctx.isLoaded, ctx.isSignedIn, ctx.organization]);

  return {
    organization: ctx.organization,
    memberships,
    isLoaded,
  };
}
