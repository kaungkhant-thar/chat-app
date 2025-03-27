"use client";

import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@web/components/ui/form";
import { useTRPC } from "@web/utils/trpc";
import { signupSchema } from "@shared/schemas";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type z } from "zod";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { toast } from "sonner";

type SignUpFormValues = z.infer<typeof signupSchema>;

const SignUpForm = () => {
  const trpc = useTRPC();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpMutation = useMutation(trpc.signup.mutationOptions());

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      const result = await signUpMutation.mutateAsync(values);
      console.log({ result });
    } catch (error) {
      console.log({ error });
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <section className="max-w-sm mx-auto min-h-screen my-20">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="***** " {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={signUpMutation.isPending}>
            {signUpMutation.isPending ? "Signing up..." : "Sign Up"}
          </Button>
        </form>
      </Form>
    </section>
  );
};

export default SignUpForm;
