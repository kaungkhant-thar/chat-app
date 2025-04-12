import { procedure, protectedProcedure, router } from '@server/trpc/trpc';

import { signupSchema, loginSchema } from '@shared/schemas';

export const authRouter = router({
  signup: procedure.input(signupSchema).mutation(async ({ input, ctx }) => {
    return ctx.authService.signup(input);
  }),

  login: procedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const { email, password } = input;
    return ctx.authService.login(email, password);
  }),

  profile: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
