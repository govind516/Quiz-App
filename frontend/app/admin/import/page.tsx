"use client";

import React, { useState } from "react";
import { UploadCloud, FileText } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Eyebrow, FadeUp } from "@/components/Reveal";
import { api } from "@/lib/api";
import type { BulkUploadResult } from "@/lib/types";

export default function BulkImport() {
  const [file, setFile] = useState<File | null>(null);

  // TODO: backend wiring — POST /api/admin/questions/bulk-upload with FormData; fallback keeps visual
  const uploadMutation = useMutation({
    mutationFn: (f: File) => {
      const form = new FormData();
      form.append("file", f);
      return api<BulkUploadResult>("/api/admin/questions/bulk-upload", { method: "POST", body: form });
    },
  });

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f) {
      uploadMutation.mutate(f, {
        onError: () => {
          // keep file shown even if backend unavailable — visual fallback
        },
      });
    }
  };

  return (
    <div data-testid="admin-import">
      <FadeUp>
        <Eyebrow>Admin</Eyebrow>
      </FadeUp>
      <FadeUp delay={0.1}>
        <h1 className="mt-4 font-display text-[48px] md:text-[64px] leading-[0.95] text-white">Bulk import</h1>
      </FadeUp>
      <FadeUp delay={0.2} className="mt-2 text-[color:var(--ink-2)]">
        Upload a CSV or JSON of questions. Everything lands in the review queue first.
      </FadeUp>

      <FadeUp delay={0.25} className="mt-10">
        <label className="block rounded-2xl glass glass-hover border-dashed border-white/15 p-10 text-center cursor-pointer" data-testid="import-drop">
          <input
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          <div className="mx-auto w-14 h-14 rounded-full grid place-items-center bg-[color:var(--violet)]/15 border border-[color:var(--violet)]/25">
            <UploadCloud className="w-6 h-6 text-[color:var(--violet-2)]" />
          </div>
          <div className="mt-4 font-display text-[24px] text-white">Drop a file or click to browse</div>
          <div className="mt-1 text-[13.5px] text-[color:var(--ink-2)]">.csv or .json · up to 10 MB</div>
          {file && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-full glass text-[12.5px] text-white">
              <FileText className="w-4 h-4 text-[color:var(--mint)]" />
              {file.name}
            </div>
          )}
          {uploadMutation.isSuccess && (
            <div className="mt-3 text-[12.5px] text-[color:var(--mint)]">
              Imported {uploadMutation.data.imported} question(s)
              {uploadMutation.data.failures.length > 0 && ` · ${uploadMutation.data.failures.length} failures`}
            </div>
          )}
          {uploadMutation.isError && (
            <div className="mt-3 text-[12.5px] text-[color:var(--coral)]">
              {(uploadMutation.error as Error).message}
            </div>
          )}
        </label>
      </FadeUp>

      <FadeUp delay={0.3} className="mt-6 rounded-2xl glass p-6">
        <div className="font-display text-[20px] text-white">Expected schema</div>
        <pre className="mt-3 font-mono text-[12.5px] leading-relaxed text-[color:var(--ink-2)] overflow-x-auto">
          {`[
  {
    "prompt": "What is a closure?",
    "type": "MCQ",
    "category": "JavaScript",
    "difficulty": "Intermediate",
    "choices": [
      { "text": "…", "correct": true },
      { "text": "…", "correct": false }
    ],
    "points": 1
  }
]`}
        </pre>
      </FadeUp>
    </div>
  );
}
