import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "email@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    throw new Error("Please enter both email and password");
                }

                // Find the user by email
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                // If no user or no hashed password, return null
                if (!user || !user.hashedPassword) {
                    throw new Error("Invalid email or password");
                }

                // Check if the password matches
                const passwordMatch = await bcrypt.compare(
                    credentials.password,
                    user.hashedPassword
                );

                // If the password doesn't match, return null
                if (!passwordMatch) {
                    throw new Error("Invalid email or password");
                }

                // Return the user without the hashed password
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                };
            }
        })
    ],
    pages: {
        signIn: '/auth/signin',
        // signOut: '/auth/signout',
        error: '/auth/signin', // Redirect to signin page with error code
        // verifyRequest: '/auth/verify-request', // (used for check email message)
        // newUser: '/auth/new-user' // New users will be directed here on first sign in
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub as string;
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };