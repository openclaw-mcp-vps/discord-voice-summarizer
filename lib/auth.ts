import { getServerSession, type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "identify email guilds",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.discordAccessToken = account.access_token;
      }

      if (account?.refresh_token) {
        token.discordRefreshToken = account.refresh_token;
      }

      if (profile && "id" in profile) {
        token.discordId = String(profile.id);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? token.discordId ?? "";
      }

      session.discordAccessToken = token.discordAccessToken;
      session.discordId = token.discordId;

      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
