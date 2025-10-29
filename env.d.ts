declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly CONVEX_DEPLOYMENT: string;
      readonly VITE_CONVEX_URL: string;
      readonly VITE_CLERK_PUBLISHABLE_KEY: string;
      readonly CLERK_SECRET_KEY: string;
    }
  }
}
