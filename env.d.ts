declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly USER_EMAIL: string;
      readonly USER_PASSWORD: string;
    }
  }
}
