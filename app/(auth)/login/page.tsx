"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <form className="w-full space-y-4 rounded-xl border bg-card p-6" onSubmit={onSubmit}>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" type="submit">
          Continue
        </Button>
        <Button className="w-full" type="button" variant="outline" onClick={() => void signIn("google")}>
          Continue with Google
        </Button>
        <p className="text-sm text-muted-foreground">
          No account? <Link className="underline" href="/signup">Create one</Link>
        </p>
      </form>
    </div>
  );
}
