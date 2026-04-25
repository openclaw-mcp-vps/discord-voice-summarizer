import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export function setupLemonSqueezy(apiKey: string): void {
  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      throw error;
    },
  });
}
