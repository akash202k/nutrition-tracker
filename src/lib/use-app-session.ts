'use client'

import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'

const LOCAL_DEV_SESSION: Session = {
    user: {
        id: 'local-dev',
        name: 'Local Dev',
        email: 'local-dev@nutrition-tracker.local',
        image: null,
    },
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
}

export function isClientAuthDisabled(): boolean {
    return process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'
}

/**
 * Client session hook. When NEXT_PUBLIC_DISABLE_AUTH=true, returns a fake
 * authenticated session so the UI skips Google sign-in.
 * Server APIs still use getSessionOrBypass + DISABLE_AUTH for the real local user id.
 */
export function useAppSession() {
    const real = useSession()

    if (isClientAuthDisabled()) {
        return {
            data: LOCAL_DEV_SESSION,
            status: 'authenticated' as const,
            update: real.update,
        }
    }

    return real
}
