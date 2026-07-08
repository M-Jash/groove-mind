import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

const BG_URL = "https://pin.it/2ogU6RSnv";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CheckVibe — AI Music Genre Classifier" },
      {
        name: "description",
        content:
          "Press start and let CheckVibe listen — uploaded tracks, laptop speakers, or the microphone.",
      },
      { property: "og:title", content: "CheckVibe" },
      {
        property: "og:description",
        content: "AI genre classification from files, system audio, or live mic.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between px-6 py-10">
      <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
        Music · Genre · AI
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center gap-16 -mt-6">
        <h1 className="font-display font-bold text-center leading-[0.9] tracking-tight text-[18vw] sm:text-[14vw] lg:text-[11rem]">
          check<span className="italic font-light">vibe</span>
        </h1>

        <Link
          to="/auth"
          aria-label="Start"
          className="group relative w-56 h-56 sm:w-72 sm:h-72 rounded-full grid place-items-center focus:outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
        >
          {/* CD outer ring */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_oklch(0.18_0.005_90)_0%,_oklch(0.28_0.005_90)_42%,_oklch(0.12_0.005_90)_43%,_oklch(0.28_0.005_90)_60%,_oklch(0.18_0.005_90)_100%)] shadow-[0_20px_60px_-15px_oklch(0_0_0/60%)] animate-spin-slow group-hover:[animation-duration:4s] transition-all" />
          {/* Concentric grooves */}
          <div className="absolute inset-6 rounded-full border border-white/5" />
          <div className="absolute inset-12 rounded-full border border-white/5" />
          <div className="absolute inset-20 rounded-full border border-white/5" />
          {/* Reflective sheen */}
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,_transparent_0deg,_oklch(1_0_0/8%)_40deg,_transparent_80deg,_transparent_180deg,_oklch(1_0_0/6%)_220deg,_transparent_260deg)] animate-spin-slow pointer-events-none" />
          {/* Center hub */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-background grid place-items-center shadow-inner">
            <div className="absolute inset-3 rounded-full border border-foreground/10" />
            <span className="font-display font-bold tracking-[0.2em] text-sm sm:text-base">
              START
            </span>
          </div>
          {/* Pinhole */}
          <div className="absolute w-3 h-3 rounded-full bg-background border border-foreground/20" />
        </Link>

        <p className="text-sm text-muted-foreground max-w-sm text-center">
          Press start to sign in and begin classifying music from files, your laptop speakers, or the
          microphone.
        </p>
      </div>

      <footer className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} CheckVibe
      </footer>
    </main>
  );
}
