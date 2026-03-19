"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      setError("Could not create account");
      return;
    }

    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (login?.error) {
      setError("Account created, but automatic login failed");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <form className="w-full space-y-4 rounded-xl border bg-card p-6" onSubmit={onSubmit}>
        <h1 className="text-2xl font-semibold">Create account</h1>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" type="submit">
          Create account
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have an account? <Link className="underline" href="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
