"use client";

import { motion } from "framer-motion";
import { ChevronDown, Leaf, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";

type Feature = {
  title: string;
  description: string;
  accent: string;
};

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  avatar: string;
};

const FEATURES: Feature[] = [
  {
    title: "Write freely",
    description: "Turn fleeting thoughts into polished pages with a calm editor that stays out of your way.",
    accent: "from-violet-500/30 to-pink-500/20",
  },
  {
    title: "Organize visually",
    description: "Drag ideas into structures that make sense: boards, pages, and systems that evolve with you.",
    accent: "from-teal-500/30 to-cyan-500/20",
  },
  {
    title: "Share instantly",
    description: "Publish beautifully in seconds, collaborate in context, and keep everyone aligned.",
    accent: "from-amber-500/30 to-orange-500/20",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Maya Chen",
    role: "Author",
    quote: "Folium became my second brain. The writing flow is unmatched.",
    avatar: "MC",
  },
  {
    name: "Rafael Ortiz",
    role: "Product Lead",
    quote: "My whole team plans roadmaps in Folium now. It feels alive.",
    avatar: "RO",
  },
  {
    name: "Layla Reed",
    role: "Researcher",
    quote: "From idea capture to publication, everything just clicks.",
    avatar: "LR",
  },
  {
    name: "Noah Kim",
    role: "Designer",
    quote: "The interface is so refined that it disappears while I work.",
    avatar: "NK",
  },
];

function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(entry.isIntersecting);
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

export function LandingPage(): JSX.Element {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [demoText, setDemoText] = useState("");
  const [demoIndex, setDemoIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [featuresRef, featuresInView] = useInView(0.2);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const demoPhrases = useMemo(
    () => [
      "Drafting tomorrow's keynote in one focused page...",
      "Building a product spec with checklists and decisions...",
      "Turning scattered notes into a beautiful weekly plan...",
    ],
    [],
  );

  const heroWords = "The workspace that thinks with you.".split(" ");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const phrase = demoPhrases[demoIndex];
    const timer = window.setTimeout(
      () => {
        if (!deleting) {
          const next = phrase.slice(0, charIndex + 1);
          setDemoText(next);
          setCharIndex((prev) => prev + 1);
          if (next === phrase) {
            window.setTimeout(() => setDeleting(true), 900);
          }
        } else {
          const next = phrase.slice(0, Math.max(charIndex - 1, 0));
          setDemoText(next);
          setCharIndex((prev) => Math.max(prev - 1, 0));
          if (!next) {
            setDeleting(false);
            setDemoIndex((prev) => (prev + 1) % demoPhrases.length);
          }
        }
      },
      deleting ? 26 : 44,
    );

    return () => window.clearTimeout(timer);
  }, [charIndex, deleting, demoIndex, demoPhrases]);

  const parallax = (depth: number) => ({
    transform: `translate(${mouse.x * depth}px, ${mouse.y * depth}px)`,
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
        onMouseMove={(event) => {
          const x = (event.clientX / window.innerWidth - 0.5) * -24;
          const y = (event.clientY / window.innerHeight - 0.5) * -24;
          setMouse({ x, y });
        }}
      >
        <div className="gradient-mesh absolute inset-0" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[14%] top-[20%] h-56 w-56 rounded-full bg-violet-500/35 blur-3xl" style={parallax(0.5)} />
          <div className="absolute right-[14%] top-[28%] h-64 w-64 rounded-full bg-pink-500/30 blur-3xl" style={parallax(0.7)} />
          <div className="absolute bottom-[12%] left-[28%] h-60 w-60 rounded-full bg-teal-500/30 blur-3xl" style={parallax(0.4)} />
          <div className="absolute bottom-[20%] right-[18%] h-48 w-48 rounded-full bg-amber-500/25 blur-3xl" style={parallax(0.65)} />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative inline-block"
          >
            <h1 className="font-display text-[clamp(3.3rem,10vw,8rem)] font-semibold leading-none tracking-[-0.04em]">
              Folium
            </h1>
            <svg
              className="absolute -left-10 top-2 h-14 w-14 text-violet-500"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M13 33c10-2 17-10 22-22 2 8 1 18-5 24-5 6-12 9-20 9"
                style={{ strokeDasharray: 90, strokeDashoffset: 90, animation: "draw-leaf 1.1s ease forwards" }}
              />
              <path
                d="M13 33c3-5 7-9 14-12"
                style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: "draw-leaf 1.1s ease 0.24s forwards" }}
              />
            </svg>
          </motion.div>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
            {heroWords.map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: index * 0.08 }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 110, damping: 16, delay: 0.55 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/signup"
              className="button-sheen rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-glow"
            >
              Start for free →
            </Link>
            <a href="#features" className="button-sheen rounded-xl border bg-white/55 px-6 py-3 text-sm font-semibold backdrop-blur dark:bg-zinc-900/40">
              See how it works
            </a>
          </motion.div>
        </div>

        <a href="#features" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[var(--text-secondary)]">
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </a>
      </section>

      <section id="features" ref={featuresRef} className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: index * 0.12 }}
              className="rounded-2xl border border-white/30 bg-white/55 p-6 backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/45"
            >
              <div className={`mb-3 h-10 w-10 rounded-lg bg-gradient-to-br ${feature.accent}`} />
              <h3 className="font-display text-2xl">{feature.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border bg-[var(--bg-surface)] p-8 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900/55">
              <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Live Demo</p>
              <h4 className="font-display text-3xl">Write in flow state</h4>
              <p className="mt-4 font-mono text-sm text-[var(--text-secondary)]">{demoText}<span className="animate-pulse">|</span></p>
            </div>
            <div className="rounded-2xl border bg-gradient-to-br from-violet-500/10 via-pink-400/10 to-teal-400/10 p-6">
              <p className="text-sm text-[var(--text-secondary)]">Everything in Folium is tuned for calm momentum: capture quickly, structure visually, and publish beautifully.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y bg-[var(--bg-surface)] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h3 className="mb-6 font-display text-3xl">Loved by thinkers worldwide</h3>
          <div className="relative overflow-hidden">
            <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-4 hover:[animation-play-state:paused]">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((item, index) => (
                <article
                  key={`${item.name}-${index}`}
                  className="w-[280px] rounded-2xl border border-transparent bg-[var(--bg-elevated)] p-5 shadow-sm"
                  style={{ borderImage: index % 2 === 0 ? "linear-gradient(135deg,#8b5cf6,#ec4899) 1" : "linear-gradient(135deg,#14b8a6,#3b82f6) 1" }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-xs font-semibold text-white">{item.avatar}</span>
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{item.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">“{item.quote}”</p>
                  <p className="mt-3 text-amber-500">★★★★★</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6">
          <div className="mr-auto">
            <div className="mb-2 flex items-center gap-2 text-xl font-semibold">
              <Leaf className="h-5 w-5 text-violet-500" /> Folium
            </div>
            <p className="text-sm text-[var(--text-secondary)]">Your thinking space, beautifully animated.</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Made by Ramy Abdelmalak.
              {" "}
              <a
                href="https://github.com/Ramyprojs/Folium"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-violet-600 hover:text-violet-500"
              >
                GitHub
              </a>
              {" "}
              ·
              {" "}
              <a
                href="https://www.linkedin.com/in/ramy-abdelmalak-aa2507177/"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-violet-600 hover:text-violet-500"
              >
                LinkedIn
              </a>
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg border bg-[var(--bg-elevated)] p-2"
            onClick={() => setTheme(theme === "dark" || resolvedTheme === "dark" ? "light" : "dark")}
          >
            {!mounted ? (
              <span className="block h-4 w-4" aria-hidden />
            ) : resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
