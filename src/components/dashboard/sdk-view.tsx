"use client";
import { useState } from "react";
import { Copy, Check, Shield, Code2, Eye, AlertTriangle } from "lucide-react";

interface SdkViewProps {
  publicKey: string;
}

export function SdkView({ publicKey }: SdkViewProps) {
  const [activeMode, setActiveMode] = useState<"invisible" | "modal" | "challenge">("invisible");
  const [copied, setCopied] = useState(false);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCodeSnippet = (mode: string) => {
    const baseUrl = "https://bo-tshield.vercel.app/bot-shield.js";
    return `<script src="${baseUrl}"></script>
<script>
  BotShield.init({
    apiKey: "${publicKey || 'bs_live_xxxxx'}",
    mode: "${mode}",
    onSuccess: (token) => {
      console.log("Verified! Token:", token);
      // Send token to your backend for verification
    },
    onBotDetected: () => {
      console.log("Bot detected!");
    }
  });
</script>`;
  };

  const modes = [
    { id: "invisible", label: "Invisible", icon: Eye, desc: "Zero friction. Humans pass silently." },
    { id: "modal", label: "Modal", icon: Shield, desc: "Shows a clean 'Verifying...' popup." },
    { id: "challenge", label: "Challenge", icon: AlertTriangle, desc: "Only shows a button if suspicious." }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Code2 className="w-6 h-6 text-blue-500" /> SDK Integration
        </h2>
        <p className="text-slate-400 mt-2">Integrate BotShield into your website in under 2 minutes.</p>
      </div>

      {/* API Key Section */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Your Public API Key</h3>
        <div className="flex items-center gap-4">
          <code className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-blue-400 font-mono text-sm break-all">
            {publicKey || "No API key found. Create a project first."}
          </code>
          <button 
            onClick={() => publicKey && copyCode(publicKey)}
            className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            aria-label="Copy API key"
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">This key is safe to expose in your frontend code. Never share your Secret Key.</p>
      </div>

      {/* Mode Selection */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Choose Verification Mode</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id as any)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isActive 
                    ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20" 
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                }`}
              >
                <Icon className={`w-5 h-5 mb-3 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                <h4 className={`font-semibold mb-1 ${isActive ? "text-white" : "text-slate-300"}`}>{mode.label}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{mode.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Snippet */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Integration Code</h3>
          <button 
            onClick={() => copyCode(getCodeSnippet(activeMode))}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>
        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-6 overflow-x-auto">
          <code className="text-sm text-slate-300 font-mono whitespace-pre">
            {getCodeSnippet(activeMode)}
          </code>
        </pre>
      </div>
    </div>
  );
}
