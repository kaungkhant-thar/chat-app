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
import { useTRPC } from "@web/lib/trpc";
import { signupSchema } from "@shared/schemas";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type z } from "zod";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore } from "@web/store/auth";
import { useRouter } from "next/navigation";

type SignUpFormValues = z.infer<typeof signupSchema>;

const SignUpForm = () => {
  const trpc = useTRPC();
  const { setToken } = useAuthStore();
  const router = useRouter();

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
      const token = await signUpMutation.mutateAsync(values);
      setToken(token);
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <section className="max-w-sm mx-auto min-h-screen my-20">
      <h3 className="text-3xl font-bold mb-2">Register a user</h3>
      <Link href="/login ">
        <p className="mb-8 underline">Already have account?</p>
      </Link>
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
