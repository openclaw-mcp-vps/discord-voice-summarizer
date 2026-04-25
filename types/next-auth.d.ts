import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    discordAccessToken?: string;
    discordId?: string;
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordAccessToken?: string;
    discordRefreshToken?: string;
    discordId?: string;
  }
}
