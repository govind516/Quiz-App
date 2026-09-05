import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Eyebrow, FadeUp } from '@/components/Reveal';
import { categories } from '@/mock';

export default function AIStudio() {
  const [topic, setTopic] = useState('');
  const [cat, setCat] = useState('Any category');
  const [count, setCount] = useState(5);
  const [type, setType] = useState('MCQ');
  const [difficulty, setDifficulty] = useState('Any');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setGenerating(true);
    setDone(false);
    setTimeout(() => { setGenerating(false); setDone(true); }, 1400);
  };

  return (
    <div data-testid="admin-ai">
      <FadeUp><Eyebrow>Admin</Eyebrow></FadeUp>
      <FadeUp delay={0.1}><h1 className="mt-4 font-display text-[48px] md:text-[64px] leading-[0.95] text-white">AI question studio</h1></FadeUp>

      <FadeUp delay={0.2} className="mt-8">
        <form onSubmit={submit} className="rounded-2xl glass p-8">
          <div className="text-[15px] text-[color:var(--ink-2)] leading-relaxed">
            <span className="font-mono text-[color:var(--violet-2)]">Gemini Flash 6.0</span> drafts questions into the <span className="font-mono text-[color:var(--gold)]">PENDING_REVIEW</span> state. Nothing goes live until you approve it in the <span className="text-white">Review queue</span>.
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <label className="block text-[13.5px] text-white mb-2">Topic</label>
              <input value={topic} onChange={(e)=>setTopic(e.target.value)} placeholder='e.g. "JavaScript closures and event loop"' data-testid="ai-topic"
                className="w-full px-4 py-3.5 rounded-xl glass text-[14px] outline-none placeholder:text-[color:var(--mute)] focus:border-[color:var(--violet)]/50 transition-colors" />
            </div>

            <div>
              <label className="block text-[13.5px] text-white mb-2">Category</label>
              <div className="relative">
                <select value={cat} onChange={(e)=>setCat(e.target.value)} data-testid="ai-category"
                  className="appearance-none w-full pl-4 pr-10 py-3.5 rounded-xl glass text-[14px] text-white outline-none cursor-pointer">
                  {['Any category', ...categories.map(c => c.name)].map((c) => <option key={c} className="bg-[#0D0D12]">{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13.5px] text-white mb-2">Count</label>
                <div className="relative">
                  <select value={count} onChange={(e)=>setCount(e.target.value)} data-testid="ai-count" className="appearance-none w-full pl-4 pr-10 py-3.5 rounded-xl glass text-[14px] text-white outline-none cursor-pointer">
                    {[3,5,8,10,15].map((n) => <option key={n} className="bg-[#0D0D12]">{n}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[13.5px] text-white mb-2">Type</label>
                <div className="relative">
                  <select value={type} onChange={(e)=>setType(e.target.value)} data-testid="ai-type" className="appearance-none w-full pl-4 pr-10 py-3.5 rounded-xl glass text-[14px] text-white outline-none cursor-pointer">
                    {['MCQ','True/False','Short answer'].map((t) => <option key={t} className="bg-[#0D0D12]">{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[13.5px] text-white mb-2">Difficulty</label>
                <div className="relative">
                  <select value={difficulty} onChange={(e)=>setDifficulty(e.target.value)} data-testid="ai-difficulty" className="appearance-none w-full pl-4 pr-10 py-3.5 rounded-xl glass text-[14px] text-white outline-none cursor-pointer">
                    {['Any','Beginner','Intermediate','Advanced'].map((d) => <option key={d} className="bg-[#0D0D12]">{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--mute)] pointer-events-none" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={generating || !topic} data-testid="ai-generate-btn"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[color:var(--violet)]/90 hover:bg-[color:var(--violet-2)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-medium transition-all">
              <Sparkles className="w-4 h-4" />{generating ? 'Generating…' : 'Generate questions'}
            </button>

            {done && (
              <div className="mt-2 rounded-xl border border-[color:var(--mint)]/25 bg-[color:var(--mint)]/[0.06] p-4 text-[13.5px] text-[color:var(--mint)]" data-testid="ai-success">
                Drafted {count} question(s) → sent to review queue.
              </div>
            )}
          </div>
        </form>
      </FadeUp>
    </div>
  );
}
