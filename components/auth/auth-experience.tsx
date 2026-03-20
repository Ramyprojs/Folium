"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";

type AuthMode = "login" | "signup";

type Orb = {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  vy: number;
  vx: number;
};

const featureHighlights = [
  "Write anything. Think clearly.",
  "Organize ideas that actually matter.",
  "Beautiful pages, zero clutter.",
] as const;

const orbPalette = ["#7c3aed", "#14b8a6", "#ec4899", "#f59e0b", "#8b5cf6", "#06b6d4"] as const;

function passwordStrength(value: string): { label: string; level: number; color: string } {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 1) return { label: "Weak", level: 1, color: "#dc2626" };
  if (score === 2) return { label: "Fair", level: 2, color: "#d97706" };
  if (score === 3) return { label: "Good", level: 3, color: "#0d9488" };
  return { label: "Strong", level: 4, color: "#16a34a" };
}

function createOrb(width: number, height: number): Orb {
  const size = 8 + Math.random() * 52;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size,
    color: orbPalette[Math.floor(Math.random() * orbPalette.length)],
    opacity: 0.3 + Math.random() * 0.5,
    vy: 0.14 + Math.random() * 0.5,
    vx: (Math.random() - 0.5) * 0.35,
  };
}

export function AuthExperience({ initialMode }: { initialMode: AuthMode }): JSX.Element {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [typeTagline, setTypeTagline] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const orbState = useRef<Orb[]>([]);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const strength = useMemo(() => passwordStrength(password), [password]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const tag = "Your thinking space.";
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypeTagline(tag.slice(0, index));
      if (index >= tag.length) {
        window.clearInterval(timer);
      }
    }, 48);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHighlightIndex((prev) => (prev + 1) % featureHighlights.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = leftRef.current;
    if (!canvas || !container) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (!orbState.current.length) {
        const count = 96;
        orbState.current = Array.from({ length: count }, () => createOrb(rect.width, rect.height));
      }
    };

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      orbState.current.forEach((orb) => {
        const p = pointer.current;
        if (p && !reduced) {
          const dx = orb.x - p.x;
          const dy = orb.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80 && dist > 0.01) {
            const force = (80 - dist) / 80;
            orb.vx += (dx / dist) * force * 0.22;
            orb.vy += (dy / dist) * force * 0.16;
          }
        }

        orb.x += orb.vx;
        orb.y -= orb.vy;
        orb.vx *= 0.97;

        if (orb.y < -80) {
          Object.assign(orb, createOrb(canvas.width, canvas.height + 80), {
            y: canvas.height + 20,
          });
        }

        context.beginPath();
        const gradient = context.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
        gradient.addColorStop(0, `${orb.color}${Math.floor(orb.opacity * 255).toString(16).padStart(2, "0")}`);
        gradient.addColorStop(1, "transparent");
        context.fillStyle = gradient;
        context.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
        context.fill();
      });

      rafRef.current = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);

    const spawn = window.setInterval(() => {
      orbState.current.push(createOrb(canvas.width, canvas.height + 120));
      orbState.current[orbState.current.length - 1].y = canvas.height + 16;
      if (orbState.current.length > 120) {
        orbState.current.splice(0, orbState.current.length - 120);
      }
    }, 4000);

    rafRef.current = window.requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      window.clearInterval(spawn);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!email) nextErrors.email = "Email is required.";
    if (!password) nextErrors.password = "Password is required.";

    if (mode === "signup") {
      if (!name) nextErrors.name = "Full name is required.";
      if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
      if (!termsAccepted) nextErrors.terms = "Please accept the terms.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setSuccess(false);

    if (mode === "login") {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setErrors({ password: "Invalid credentials." });
        setLoading(false);
        return;
      }

      setSuccess(true);
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 520);
      return;
    }

    const signupResponse = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!signupResponse.ok) {
      const body = (await signupResponse.json()) as { error?: string };
      setErrors({ email: body.error || "Unable to create account." });
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/dashboard",
    });

    setSuccess(true);
    window.setTimeout(() => {
      router.push("/dashboard");
    }, 520);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[var(--bg-primary)] lg:grid-cols-2">
      <div
        ref={leftRef}
        className="relative min-h-[320px] overflow-hidden border-b border-[var(--border-hex)] lg:min-h-screen lg:border-b-0 lg:border-r"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          pointer.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };
        }}
        onMouseLeave={() => {
          pointer.current = null;
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
          <svg className="h-16 w-16 text-violet-500" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path
              d="M13 33c10-2 17-10 22-22 2 8 1 18-5 24-5 6-12 9-20 9"
              strokeDasharray="90"
              strokeDashoffset="90"
              style={{ animation: "draw-leaf 1.5s ease forwards" }}
            />
            <path
              d="M13 33c3-5 7-9 14-12"
              strokeDasharray="40"
              strokeDashoffset="40"
              style={{ animation: "draw-leaf 1.5s ease 0.18s forwards" }}
            />
          </svg>
          <p className="font-display mt-5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-[clamp(1.7rem,4vw,2.6rem)] italic text-transparent dark:from-white dark:via-zinc-100 dark:to-zinc-300">
            {typeTagline}
          </p>

          <div className="mt-4 h-7 overflow-hidden text-sm text-zinc-700/90 dark:text-white/90">
            <AnimatePresence mode="wait">
              <motion.p
                key={highlightIndex}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35 }}
              >
                {featureHighlights[highlightIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="absolute bottom-8 left-8 flex items-center gap-2 text-xs text-zinc-700/90 dark:text-white/90">
            <div className="flex -space-x-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-violet-500 text-[10px]">AL</span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-teal-500 text-[10px]">MK</span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-pink-500 text-[10px]">SJ</span>
            </div>
            <span>Join 12,000+ writers and thinkers</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-10 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md rounded-3xl bg-[var(--bg-elevated)] p-8 shadow-lg"
        >
          <p className="mb-2 text-sm text-[var(--text-secondary)]">👋</p>
          <h1 className="font-display text-[2rem] font-bold leading-tight">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mb-6 mt-1 text-sm text-[var(--text-secondary)]">
            {mode === "login" ? "Sign in to your workspace" : "Join Folium and start building your thinking space"}
          </p>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              {mode === "signup" && (
                <FloatingField
                  label="Full name"
                  value={name}
                  onChange={setName}
                  error={errors.name}
                  valid={name.length > 2}
                  autoComplete="name"
                />
              )}

              <FloatingField
                label="Email"
                value={email}
                onChange={setEmail}
                error={errors.email}
                valid={email.includes("@")}
                autoComplete="email"
              />

              <FloatingField
                label="Password"
                value={password}
                onChange={setPassword}
                error={errors.password}
                valid={password.length >= 8}
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                rightAction={
                  <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-[var(--text-secondary)]">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {mode === "signup" && (
                <>
                  <FloatingField
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    error={errors.confirmPassword}
                    valid={!!confirmPassword && confirmPassword === password}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                  />
                  <div className="rounded-lg border bg-[var(--bg-surface)] p-2">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>Password strength</span>
                      <span style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <motion.div
                        initial={false}
                        animate={{ width: `${strength.level * 25}%`, backgroundColor: strength.color }}
                        className="h-full"
                      />
                    </div>
                  </div>
                </>
              )}

              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={mode === "login" ? remember : termsAccepted}
                  onChange={(event) => {
                    if (mode === "login") {
                      setRemember(event.target.checked);
                    } else {
                      setTermsAccepted(event.target.checked);
                    }
                  }}
                  className="h-4 w-4 rounded border-[var(--border-hex)] accent-violet-600"
                />
                {mode === "login" ? (
                  "Remember me"
                ) : (
                  <span>
                    I agree to the <Link href="#" className="text-violet-600">Terms</Link>
                  </span>
                )}
              </label>
              {errors.terms && <ErrorText message={errors.terms} />}

              <button
                type="submit"
                className="button-sheen relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 text-sm font-semibold text-white shadow-glow"
              >
                {loading && !success && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/90 border-t-transparent" />}
                {!loading && !success && (mode === "login" ? "Sign in" : "Create account")}
                {success && <CheckCircle2 className="h-5 w-5" />}
              </button>

              <div className="flex items-center gap-3 py-1 text-xs text-[var(--text-muted)]">
                <span className="h-px flex-1 bg-[var(--border-hex)]" />
                or continue with
                <span className="h-px flex-1 bg-[var(--border-hex)]" />
              </div>

              <button
                type="button"
                className="w-full rounded-xl border border-[var(--border-hex)] px-4 py-2.5 text-sm font-medium"
                onClick={() => void signIn("google", { callbackUrl: "/dashboard" })}
              >
                Continue with Google
              </button>

              {mode === "login" && (
                <button type="button" className="text-xs text-violet-600" onClick={() => setForgotOpen((prev) => !prev)}>
                  Forgot password?
                </button>
              )}

              <AnimatePresence>
                {forgotOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl border bg-[var(--bg-surface)] p-3"
                  >
                    <p className="mb-2 text-xs text-[var(--text-secondary)]">Password reset link</p>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(event) => setForgotEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="mb-2 w-full rounded-lg border border-[var(--border-hex)] bg-transparent px-3 py-2 text-sm"
                    />
                    <button type="button" className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white">Send link</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.form>
          </AnimatePresence>

          <p className="mt-5 text-sm text-[var(--text-secondary)]">
            {mode === "login" ? "No account yet? " : "Already have an account? "}
            <button
              type="button"
              className="font-semibold text-violet-600"
              onClick={() => {
                const nextMode = mode === "login" ? "signup" : "login";
                setMode(nextMode);
                router.replace(nextMode === "login" ? "/login" : "/signup");
              }}
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function ErrorText({ message }: { message: string }): JSX.Element {
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="text-xs text-red-500"
    >
      {message}
    </motion.p>
  );
}

function FloatingField({
  label,
  value,
  onChange,
  error,
  valid,
  type = "text",
  autoComplete,
  rightAction,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  valid?: boolean;
  type?: string;
  autoComplete?: string;
  rightAction?: JSX.Element;
}): JSX.Element {
  const [focused, setFocused] = useState(false);

  return (
    <div className={error ? "field-error-shake" : ""}>
      <label className="relative block">
        <span
          className={`pointer-events-none absolute left-3 transition-all ${focused || value ? "-top-2 text-[10px] text-violet-600" : "top-3 text-sm text-[var(--text-secondary)]"}`}
          style={{ background: "var(--bg-elevated)", paddingInline: focused || value ? 6 : 0 }}
        >
          {label}
        </span>
        <input
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-11 w-full rounded-xl border border-[var(--border-hex)] bg-transparent px-3 pr-10 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
        />
        <span className="absolute right-3 top-3.5 flex items-center gap-2">
          {valid && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {rightAction}
        </span>
      </label>
      {error && <ErrorText message={error} />}
    </div>
  );
}
