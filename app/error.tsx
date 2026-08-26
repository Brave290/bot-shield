"use client";

import { useEffect } from "react";
import { Icons } from "@/components/site";
import { Navigation } from "@/components/Navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service (e.g., Sentry)
    console.error("🚨 BotShield Application Error:", error);
  }, [error]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-6">
            <Icons.Shield className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mb-3">Something went wrong.</h1>
          <p className="text-slate-400 font-light mb-6">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </main>
    </>
  );
}
