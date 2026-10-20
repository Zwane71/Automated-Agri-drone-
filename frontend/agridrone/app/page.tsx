
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Leaf,
  Menu,
  Microscope,
  Scan,
  ShieldCheck,
  Sprout,
  X,
} from "lucide-react";

const features = [
  {
    number: "01",
    icon: Scan,
    title: "Cabbage Detection",
    description:
      "Identify cabbage plants in crop images using your trained AI detection model.",
    tag: "Computer vision",
  },
  {
    number: "02",
    icon: Microscope,
    title: "Disease Analysis",
    description:
      "Analyze crop images for potential disease symptoms and review the model's findings.",
    tag: "AI analysis",
  },
  {
    number: "03",
    icon: Camera,
    title: "Live Field Monitoring",
    description:
      "Connect to your camera feed and inspect crop conditions through your application.",
    tag: "Live monitoring",
  },
  {
    number: "04",
    icon: Sprout,
    title: "Soil Monitoring",
    description:
      "Build a broader picture of field conditions by integrating supported soil sensors.",
    tag: "Sensor integration",
  },
];

const steps = [
  {
    number: "01",
    title: "Capture",
    description: "Capture crop images through your camera or drone.",
  },
  {
    number: "02",
    title: "Detect",
    description: "Use computer vision to identify cabbage plants.",
  },
  {
    number: "03",
    title: "Analyze",
    description: "Run disease analysis on the relevant crop images.",
  },
  {
    number: "04",
    title: "Review",
    description: "View the available AI results in your application.",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-green-800">
      <span className="h-2 w-2 rounded-full bg-lime-500" />
      {children}
    </div>
  );
}

function FeatureCard({
  feature,
}: {
  feature: (typeof features)[number];
}) {
  const Icon = feature.icon;

  return (
    <article className="group rounded-2xl border border-stone-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-xl hover:shadow-green-950/5">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
          <Icon size={23} strokeWidth={1.8} />
        </div>
        <span className="font-mono text-sm text-stone-400">
          {feature.number}
        </span>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-700">
        {feature.tag}
      </p>

      <h3 className="mb-3 text-xl font-semibold tracking-tight text-stone-900">
        {feature.title}
      </h3>

      <p className="text-sm leading-7 text-stone-600">
        {feature.description}
      </p>

      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-green-800">
        Explore capability
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </article>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#FAFBF7] text-stone-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#FAFBF7]/95 backdrop-blur-xl">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12"
        >
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-900 text-lime-300">
              <Sprout size={24} />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Agri<span className="text-green-700">Vision</span>
              <span className="ml-1 text-xs font-medium text-stone-500">
                AI
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#platform" className="text-sm text-stone-600 hover:text-green-800">
              Platform
            </a>
            <a href="#how-it-works" className="text-sm text-stone-600 hover:text-green-800">
              How it works
            </a>
            <a href="#about" className="text-sm text-stone-600 hover:text-green-800">
              About
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/census"
              className="px-4 py-2.5 text-sm font-semibold text-green-900 hover:text-green-700"
            >
              Open dashboard
            </Link>
            <Link
              href="/census"
              className="inline-flex items-center gap-2 rounded-xl bg-green-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Explore platform <ArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 md:hidden"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-stone-200 bg-[#FAFBF7] px-5 py-5 md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-5">
              <a href="#platform" onClick={closeMenu} className="text-sm font-medium">
                Platform
              </a>
              <a href="#how-it-works" onClick={closeMenu} className="text-sm font-medium">
                How it works
              </a>
              <a href="#about" onClick={closeMenu} className="text-sm font-medium">
                About
              </a>
              <Link
                href="/census"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Open AI dashboard <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:px-12 lg:py-24">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3.5 py-2 text-xs font-bold tracking-wide text-green-900">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime-500" />
              AI-POWERED AGRICULTURE
            </div>

            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Healthier crops.
              <span className="mt-2 block text-green-800">
                Smarter farming.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-stone-600 sm:text-lg">
              Bringing artificial intelligence and aerial monitoring together
              to help you identify cabbage crops, analyze potential diseases,
              and build a clearer picture of field conditions.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/census"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-green-900 px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-green-950/10 transition hover:-translate-y-0.5 hover:bg-green-800"
              >
                Open AI dashboard <ArrowRight size={18} />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-7 py-4 text-sm font-semibold text-stone-800 transition hover:border-green-700"
              >
                Discover the process <ArrowDownRight size={17} />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-stone-200 pt-6 text-sm text-stone-600">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-green-700" />
                AI crop detection
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-green-700" />
                Disease analysis
              </span>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-lime-200/40 blur-2xl" />

            <div
              role="img"
              aria-label="Aerial view of green agricultural crop rows"
              className="relative min-h-[390px] overflow-hidden rounded-[1.75rem] bg-green-950 bg-cover bg-center sm:min-h-[490px] lg:min-h-[550px]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(7,35,22,0.04) 20%, rgba(7,35,22,0.62) 100%), url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85')",
              }}
            >
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/20 bg-green-950/50 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-lime-400" />
                Precision agriculture
              </div>

              <div className="absolute left-5 right-5 top-24 sm:left-8 sm:right-8">
                <div className="relative h-32 rounded-xl border border-lime-300/70 sm:h-40">
                  <div className="absolute -left-px -top-px rounded-tl-lg border-l-2 border-t-2 border-lime-300 p-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white">
                      Field view
                    </span>
                  </div>
                  <div className="absolute -bottom-px -right-px h-5 w-5 border-b-2 border-r-2 border-lime-300" />
                  <div className="absolute bottom-3 right-3 rounded-md bg-green-950/75 px-2.5 py-1.5 text-[10px] font-semibold tracking-wider text-lime-300 backdrop-blur-sm">
                    AI MONITORING
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-lime-300">
                  From field to insight
                </p>
                <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                  See your crops from a new perspective.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                  A practical AI platform for crop observation and intelligent
                  agricultural research.
                </p>
              </div>
            </div>

            <div className="absolute -bottom-5 right-3 flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-xl sm:-right-5 sm:p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-100 text-green-900">
                <ShieldCheck size={23} />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">
                  AI-assisted insights
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Detection and analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction strip */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:grid-cols-3 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <Scan className="shrink-0 text-green-800" size={23} />
            <div>
              <p className="font-semibold">Detect</p>
              <p className="mt-1 text-sm text-stone-500">
                Identify crops
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Microscope className="shrink-0 text-green-800" size={23} />
            <div>
              <p className="font-semibold">Analyze</p>
              <p className="mt-1 text-sm text-stone-500">
                Investigate possible disease
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Camera className="shrink-0 text-green-800" size={23} />
            <div>
              <p className="font-semibold">Monitor</p>
              <p className="mt-1 text-sm text-stone-500">
                Review camera observations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="platform" className="scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel>Platform capabilities</SectionLabel>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Technology that works
                <span className="text-green-800"> in the field.</span>
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-stone-600 sm:text-base">
              A growing agricultural research platform that brings crop
              detection, disease analysis, and field monitoring into one place.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.number} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section
        id="how-it-works"
        className="scroll-mt-24 bg-green-950 py-20 text-white sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <SectionLabel>How it works</SectionLabel>

          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                From crop images
                <span className="block text-lime-300">
                  to useful insights.
                </span>
              </h2>
              <p className="mt-6 max-w-lg text-sm leading-7 text-green-100/75 sm:text-base">
                The platform combines image capture with trained AI models to
                help you inspect crops and review the results. Each
                stage contributes to a clearer view of crop conditions.
              </p>

              <Link
                href="/census"
                className="mt-8 inline-flex items-center gap-3 rounded-xl bg-lime-300 px-6 py-4 text-sm font-bold text-green-950 transition hover:bg-lime-200"
              >
                Enter the platform <ArrowRight size={17} />
              </Link>
            </div>

            <div className="divide-y divide-white/15 border-y border-white/15">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="flex gap-5 py-6 sm:gap-7 sm:py-7"
                >
                  <span className="font-mono text-sm text-lime-300">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-green-100/70">
                      {step.description}
                    </p>
                  </div>
                  <ChevronRight
                    size={20}
                    className="ml-auto mt-1 shrink-0 text-green-300/60"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About and CTA */}
      <section id="about" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-lime-100">
          <div className="grid items-center gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1fr_auto] lg:px-16 lg:py-16">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-green-900">
                <Leaf size={16} />
                Agriculture meets AI
              </div>
              <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-green-950 sm:text-5xl">
                Better crop visibility starts here.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-green-950/75 sm:text-base">
                Explore the project and see how computer vision can support
                crop observation, disease research, and smarter agricultural
                workflows.
              </p>
            </div>

            <Link
              href="/census"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-green-950 px-7 py-4 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Open the application <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-900 text-lime-300">
              <Sprout size={21} />
            </span>
            <span className="font-bold tracking-tight">
              Agri<span className="text-green-700">Vision</span> AI
            </span>
          </Link>

          <p className="text-sm leading-6 text-stone-500">
            AI-assisted crop monitoring for agricultural research.
          </p>

          <Link
            href="/census"
            className="inline-flex items-center gap-2 text-sm font-semibold text-green-900 hover:text-green-700"
          >
            Launch platform <ArrowRight size={16} />
          </Link>
        </div>

        <div className="border-t border-stone-100 px-5 py-4 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} AgriVision AI. Agricultural technology
          research project.
        </div>
      </footer>
    </main>
  );
}
