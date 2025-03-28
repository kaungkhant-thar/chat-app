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
import { loginSchema } from "@shared/schemas";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type z } from "zod";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore } from "@web/store/auth";
import { useRouter } from "next/navigation";

type SignUpFormValues = z.infer<typeof loginSchema>;

const SignUpForm = () => {
  const trpc = useTRPC();
  const { token, isAuthenticated, setToken } = useAuthStore();
  console.log({ token, isAuthenticated });
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation(trpc.login.mutationOptions());

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      const token = await loginMutation.mutateAsync(values);
      setToken(token);
      router.push("/");
    } catch (error) {
      console.log({ error });
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <section className="max-w-sm mx-auto min-h-screen my-20">
      <h3 className="text-3xl font-bold mb-2">Login</h3>

      <Link href="/signup ">
        <p className="mb-8 underline">Don't have account yet?</p>
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

          <Button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Login..." : "Login"}
          </Button>
        </form>
      </Form>
    </section>
  );
};

export default SignUpForm;
