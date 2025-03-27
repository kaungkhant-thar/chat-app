"use client";

import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@web/src/utils/trpc";
import React, { useState } from "react";

const SignUpForm = () => {
  const trpc = useTRPC();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signUpMutation = useMutation(trpc.signup.mutationOptions());

  const handleSubmit = () => {
    signUpMutation.mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={signUpMutation.isPending}>
        {signUpMutation.isPending ? "Signing up..." : "Sign Up"}
      </button>

      {signUpMutation.isError && (
        <p style={{ color: "red" }}>Error: {signUpMutation.error.message}</p>
      )}
      {signUpMutation.isSuccess && <p>Successfully signed up!</p>}
    </form>
  );
};

export default SignUpForm;
