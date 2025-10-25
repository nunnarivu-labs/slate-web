import { createServerFn } from '@tanstack/react-start';

export const isEmailAndPasswordValid = createServerFn()
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(
    ({ data }) =>
      process.env.USER_EMAIL === data.email &&
      process.env.USER_PASSWORD === data.password,
  );
