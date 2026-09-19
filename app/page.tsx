"use client";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";

type Warning = { title: string; description: string; points: number };
type AIAnalysis = {
  riskLevel: "Low" | "Medium" | "High";
  riskScore: number;
  summary: string;
  redFlags: { title: string; explanation: string }[];
  recommendations: string[];
  verificationSteps: string[];
  disclaimer: string;
};

type UploadedFile = { name: string; mimeType: string; data: string; preview?: string };

const checklistItems = [
  "Company website and careers page verified",
  "Recruiter email domain checked",
  "No registration, training, or interview fee requested",
  "Job details confirmed through an official channel",
  "Interview and selection process verified",
];

export default function Home() {
  const [offerText, setOfferText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [checkedItems, setCheckedItems] = useState<boolean[]>(checklistItems.map(() => false));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checklistProgress = useMemo(() => Math.round((checkedItems.filter(Boolean).length / checklistItems.length) * 100), [checkedItems]);
  const riskTextClass = aiAnalysis?.riskLevel === "High" ? "text-rose-600" : aiAnalysis?.riskLevel === "Medium" ? "text-amber-600" : "text-emerald-600";
  const riskBarClass = aiAnalysis?.riskLevel === "High" ? "bg-rose-500" : aiAnalysis?.riskLevel === "Medium" ? "bg-amber-500" : "bg-emerald-500";

  const handleFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage("Please upload a file smaller than 8 MB.");
      return;
    }
    if (!file.type.startsWith("image/") && file.type !== "application/pdf" && file.type !== "text/plain") {
      setErrorMessage("Supported formats: images, PDF and TXT.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setUploadedFile({ name: file.name, mimeType: file.type || "application/octet-stream", data: dataUrl.split(",")[1] || "", preview: file.type.startsWith("image/") ? dataUrl : undefined });
      setErrorMessage("");
    };
    reader.readAsDataURL(file);
  };

  const analyzeOffer = async () => {
    if (!offerText.trim() && !uploadedFile) {
      setErrorMessage("Paste an offer or upload a screenshot/PDF first.");
      return;
    }
    const text = offerText.toLowerCase();
    const checks = [
      { keywords: ["registration fee", "joining fee", "security deposit", "pay ₹", "pay rs"], title: "Payment Request", description: "The offer asks for money before joining.", points: 30 },
      { keywords: ["guaranteed job", "100% selection", "guaranteed placement"], title: "Fake Employment Promise", description: "The offer promises guaranteed employment.", points: 25 },
      { keywords: ["urgent", "immediately", "within 24 hours", "limited time"], title: "Urgency or Pressure", description: "The message creates unnecessary urgency.", points: 20 },
      { keywords: ["whatsapp only", "telegram", "personal gmail", "contact only on whatsapp"], title: "Communication Red Flag", description: "The recruiter uses unofficial communication channels.", points: 15 },
      { keywords: ["no interview", "without interview", "direct selection"], title: "No Interview Required", description: "The job promises selection without a normal interview process.", points: 20 },
    ];
    setWarnings(checks.filter((check) => check.keywords.some((keyword) => text.includes(keyword))));
    setLoading(true); setErrorMessage(""); setAiAnalysis(null); setCheckedItems(checklistItems.map(() => false));
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerText, file: uploadedFile ? { name: uploadedFile.name, mimeType: uploadedFile.mimeType, data: uploadedFile.data } : null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed.");
      setAiAnalysis(data.analysis);
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Unable to analyze this offer."); }
    finally { setLoading(false); }
  };

  const resetAnalysis = () => { setOfferText(""); setUploadedFile(null); setWarnings([]); setAiAnalysis(null); setErrorMessage(""); setCheckedItems(checklistItems.map(() => false)); if (fileInputRef.current) fileInputRef.current.value = ""; };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mb-3 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-300">AI-POWERED JOB SAFETY</div><h1 className="text-4xl font-black tracking-tight sm:text-6xl">Offer<span className="text-cyan-300">Shield</span> <span>🛡️</span></h1><p className="mt-3 max-w-2xl text-slate-400">Detect suspicious job offers, understand the warning signs, and verify before you trust.</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">🔒 Your analysis is informational</div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-2xl font-bold">Analyze an offer</h2><p className="mt-1 text-sm text-slate-400">Paste text or upload a screenshot/PDF.</p></div><button onClick={() => setOfferText("Congratulations! You are selected for a work-from-home job with a salary of ₹35,000. Pay a registration fee of ₹2,000 within 24 hours. No interview is required. Contact us only through WhatsApp.")} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">Try sample</button></div>
            <textarea value={offerText} onChange={(e) => setOfferText(e.target.value)} placeholder="Paste your job offer message here..." className="h-48 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-300" />
            <div className="mt-4 rounded-2xl border border-dashed border-cyan-300/40 bg-cyan-300/5 p-4"><input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} /><button onClick={() => fileInputRef.current?.click()} className="w-full rounded-xl border border-cyan-300/40 px-4 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-300/10">📎 Upload screenshot, PDF or TXT</button>{uploadedFile && <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-900 p-3 text-sm"><span className="truncate text-slate-300">📄 {uploadedFile.name}</span><button onClick={() => setUploadedFile(null)} className="ml-3 text-rose-300">Remove</button></div>}{uploadedFile?.preview && 
            <Image
  src={uploadedFile.preview}
  alt="Uploaded offer preview"
  width={800}
  height={400}
  unoptimized
  className="mt-3 max-h-48 w-full rounded-xl object-contain"
  /> }
  </div>
         {errorMessage && <p className="mt-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{errorMessage}</p>}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row"><button onClick={analyzeOffer} disabled={loading} className="flex-1 rounded-xl bg-cyan-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Analyzing with Gemini..." : "Analyze Offer →"}</button><button onClick={resetAnalysis} className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-slate-300 hover:bg-white/10">Reset</button></div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-300/15 to-violet-400/10 p-6"><p className="text-sm font-semibold uppercase tracking-widest text-cyan-200">Safety first</p><h2 className="mt-4 text-3xl font-bold">Pause. Verify. Proceed.</h2><div className="mt-6 space-y-4 text-sm text-slate-300"><p>💸 Never pay money to secure a job.</p><p>🏢 Verify the company using its official website.</p><p>📧 Check whether the recruiter uses an official domain.</p><p>⏳ Ignore pressure to act immediately.</p></div></div>
        </section>

        {aiAnalysis && <section className="mt-8 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-slate-400">AI risk score</p><p className={`mt-1 text-5xl font-black ${riskTextClass}`}>{aiAnalysis.riskScore}<span className="text-xl text-slate-500">/100</span></p></div><div className={`rounded-full px-4 py-2 text-sm font-bold ${riskTextClass} bg-white/10`}>{aiAnalysis.riskLevel} Risk</div></div><div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-800"><div className={`h-full ${riskBarClass} transition-all`} style={{ width: `${aiAnalysis.riskScore}%` }} /></div><p className="mt-4 leading-7 text-slate-300">{aiAnalysis.summary}</p></div>
          <div className="grid gap-6 lg:grid-cols-2"><div className="rounded-3xl border border-white/10 bg-white/[0.07] p-6"><h2 className="text-xl font-bold">📊 Risk breakdown</h2><p className="mt-2 text-sm text-slate-400">Local signals that contributed to the supporting score.</p><div className="mt-5 space-y-4">{warnings.length ? warnings.map((w, i) => <div key={i}><div className="mb-1 flex justify-between text-sm"><span>{w.title}</span><span className="text-cyan-200">{w.points} pts</span></div><div className="h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-300" style={{ width: `${Math.min(w.points / 30, 1) * 100}%` }} /></div></div>) : <p className="text-slate-400">No local warning patterns detected.</p>}</div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-6"><h2 className="text-xl font-bold">🚩 AI red flags</h2><div className="mt-4 space-y-3">{aiAnalysis.redFlags.map((flag, i) => <div key={i} className="rounded-2xl border border-rose-300/20 bg-rose-300/5 p-4"><p className="font-bold text-rose-200">{flag.title}</p><p className="mt-1 text-sm leading-6 text-slate-300">{flag.explanation}</p></div>)}</div></div></div>
          <div className="grid gap-6 lg:grid-cols-2"><div className="rounded-3xl border border-white/10 bg-white/[0.07] p-6"><h2 className="text-xl font-bold">🛡️ Recommendations</h2><ul className="mt-4 space-y-3">{aiAnalysis.recommendations.map((item, i) => <li key={i} className="rounded-xl bg-emerald-300/10 p-3 text-sm text-slate-200">✓ {item}</li>)}</ul></div><div className="rounded-3xl border border-white/10 bg-white/[0.07] p-6"><div className="flex justify-between"><h2 className="text-xl font-bold">✅ Verification</h2><span className="font-bold text-cyan-200">{checklistProgress}%</span></div><div className="mt-4 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-300" style={{ width: `${checklistProgress}%` }} /></div><div className="mt-4 space-y-2">{checklistItems.map((item, i) => <label key={item} className="flex gap-3 rounded-xl border border-white/10 p-3 text-sm text-slate-300"><input type="checkbox" checked={checkedItems[i]} onChange={(e) => setCheckedItems((current) => current.map((v, j) => j === i ? e.target.checked : v))} className="mt-1" /><span className={checkedItems[i] ? "line-through opacity-50" : ""}>{item}</span></label>)}</div></div></div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">⚠️ {aiAnalysis.disclaimer}</div>
        </section>}
        <footer className="mt-10 text-center text-xs text-slate-500">OfferShield AI • Built for safer job hunting • AI output should be independently verified</footer>
      </div>
    </main>
  );
}
