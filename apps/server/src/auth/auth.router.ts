import { procedure, protectedProcedure, router } from '@server/trpc/trpc';

import { signupSchema, loginSchema, profileSchema } from '@shared/schemas';

export const authRouter = router({
  signup: procedure.input(signupSchema).mutation(async ({ input, ctx }) => {
    const { email, password } = input;
    return ctx.authService.signup(email, password);
  }),

  login: procedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const { email, password } = input;
    return ctx.authService.login(email, password);
  }),

  profile: protectedProcedure.query(async ({ input, ctx }) => {
    console.log(ctx.user, 'from profile');
    return ctx.user;
  }),
});
