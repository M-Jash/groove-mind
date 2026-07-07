import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Upload, Waves, History, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sonogram — AI Music Genre Classifier" },
      {
        name: "description",
        content:
          "Upload any track and let Sonogram's AI reveal its genre in seconds, with confidence scores and a beautiful waveform view.",
      },
      { property: "og:title", content: "Sonogram — AI Music Genre Classifier" },
      {
        property: "og:description",
        content: "Instant AI-powered music genre classification with waveform visualization.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 glass-strong">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">Sonogram</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button
              asChild
              className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-95 hover:shadow-[var(--shadow-glow)]"
            >
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs uppercase tracking-widest text-muted-foreground mb-6">
          <Zap className="w-3.5 h-3.5" /> AI-powered genre detection
        </div>
        <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
          Hear a track.
          <br />
          <span className="gradient-text">Know its genre.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Drop an MP3 or WAV and Sonogram analyzes the waveform, then predicts the genre with a
          confidence score — in seconds.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 px-6 bg-[image:var(--gradient-primary)] text-primary-foreground font-semibold hover:opacity-95 hover:shadow-[var(--shadow-glow-strong)] transition-all animate-pulse-glow"
          >
            <Link to="/auth">
              Try it free <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="h-12 px-6 glass">
            <a href="#features">See features</a>
          </Button>
        </div>

        {/* Fake waveform */}
        <div className="mt-16 glass-strong rounded-3xl p-6 sm:p-10 relative overflow-hidden">
          <div className="flex items-end justify-center gap-1 h-40 sm:h-56">
            {Array.from({ length: 60 }).map((_, i) => {
              const h = 20 + Math.abs(Math.sin(i * 0.4)) * 80 + Math.abs(Math.cos(i * 0.7)) * 40;
              return (
                <div
                  key={i}
                  className="w-1.5 sm:w-2 rounded-full bg-[image:var(--gradient-primary)] animate-float"
                  style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Upload,
              title: "Drop any track",
              body: "MP3 or WAV, up to 20 MB. No account needed to try the demo.",
            },
            {
              icon: Waves,
              title: "See the waveform",
              body: "A rendered visualization of every peak in your audio.",
            },
            {
              icon: History,
              title: "Track your history",
              body: "Every prediction is saved to your private dashboard.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <GlassCard key={title} className="hover:shadow-[var(--shadow-glow)] hover:-translate-y-1">
              <div className="w-11 h-11 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center mb-4">
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Sonogram
      </footer>
    </div>
  );
}
