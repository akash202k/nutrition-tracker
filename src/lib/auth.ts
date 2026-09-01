import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions, Session } from "next-auth"
import { getServerSession } from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"

const LOCAL_DEV_EMAIL = "local-dev@nutrition-tracker.local"
const LOCAL_DEV_NAME = "Local Dev"

export function isAuthDisabled(): boolean {
    return (
        process.env.DISABLE_AUTH === "true" &&
        process.env.NODE_ENV !== "production"
    )
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        session: async ({ session, user }) => {
            if (session?.user) {
                session.user.id = user.id
            }
            return session
        },
    },
}

async function getOrCreateLocalDevUser() {
    const existing = await prisma.user.findUnique({
        where: { email: LOCAL_DEV_EMAIL },
    })
    if (existing) return existing

    return prisma.user.create({
        data: {
            email: LOCAL_DEV_EMAIL,
            name: LOCAL_DEV_NAME,
        },
    })
}

/** Session for API routes — bypasses NextAuth when DISABLE_AUTH=true (non-production). */
export async function getSessionOrBypass(): Promise<Session | null> {
    if (isAuthDisabled()) {
        const user = await getOrCreateLocalDevUser()
        return {
            user: {
                id: user.id,
                name: user.name ?? LOCAL_DEV_NAME,
                email: user.email ?? LOCAL_DEV_EMAIL,
                image: user.image,
            },
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }
    }

    return getServerSession(authOptions)
}
