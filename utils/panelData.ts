export type LineKind = "neutral" | "verified" | "flagged";

export interface PanelLine {
  text: string;
  kind: LineKind;
}

export interface PanelConfig {
  id: string;
  fileName: string;
  depth: number;          // 0 = far background, 1 = closest foreground
  similarity: number;
  statusCycle: string[];
  className: string;      // Tailwind position + size
  lines: PanelLine[];
}

/**
 * Panels are distributed across left, right, and mid-depth layers
 * with asymmetric placement to fill empty space while keeping the
 * centre clear for the login form.
 *
 * depth drives: scale, blur, parallax offset, and z-index.
 */
export const PANEL_CONFIGS: PanelConfig[] = [
  /* ── TOP-LEFT  (far, small) ─────────────────────────────────── */
  {
    id: "panel-a",
    fileName: "repository_scan.ts",
    depth: 0.25,
    similarity: 82,
    className: "left-[3%] top-[6%] w-[clamp(210px,22vw,320px)]",
    statusCycle: ["Analyzing...", "Cross-checking repositories...", "Match Found"],
    lines: [
      { text: "const fps = await hashRepository(data)", kind: "verified" },
      { text: "for (const chunk of fps) {", kind: "neutral" },
      { text: "  score += compare(chunk, sources)", kind: "flagged" },
      { text: "  confidence = model.predict(vec)", kind: "neutral" },
      { text: "  auditLog.push({ status: 'ok' })", kind: "verified" }
    ]
  },

  /* ── BOTTOM-LEFT  (mid, medium) ─────────────────────────────── */
  {
    id: "panel-b",
    fileName: "integrity_guard.py",
    depth: 0.55,
    similarity: 76,
    className: "left-[5%] bottom-[10%] w-[clamp(230px,25vw,360px)]",
    statusCycle: ["Cross-checking...", "Analyzing...", "Match Found"],
    lines: [
      { text: "def enforce(files):", kind: "neutral" },
      { text: "    score = originality(files)", kind: "verified" },
      { text: "    risk = semantic_diff(files)", kind: "neutral" },
      { text: "    if risk.matches > 0.79:", kind: "flagged" },
      { text: "        raise DuplicateDetected()", kind: "flagged" }
    ]
  },

  /* ── TOP-RIGHT  (close, large) ──────────────────────────────── */
  {
    id: "panel-c",
    fileName: "compliance.engine",
    depth: 0.82,
    similarity: 91,
    className: "right-[2%] top-[8%] w-[clamp(230px,24vw,350px)]",
    statusCycle: ["Match Found", "Analyzing...", "Cross-checking..."],
    lines: [
      { text: "pipeline.start('ProjectGuard AI')", kind: "neutral" },
      { text: "graph.link(authority, evidence)", kind: "verified" },
      { text: "risk = scanner.validate(batch)", kind: "neutral" },
      { text: "if risk >= 0.8: notify('risk')", kind: "flagged" },
      { text: "return status('verified')", kind: "verified" }
    ]
  },

  /* ── MID-RIGHT  (far, small) ────────────────────────────────── */
  {
    id: "panel-d",
    fileName: "pattern_detector.rs",
    depth: 0.2,
    similarity: 68,
    className: "right-[4%] top-[52%] w-[clamp(200px,20vw,290px)]",
    statusCycle: ["Scanning...", "Matching patterns...", "Clean"],
    lines: [
      { text: "fn detect(src: &[u8]) -> Result {", kind: "neutral" },
      { text: "  let hash = blake3::hash(src);", kind: "verified" },
      { text: "  db.query(hash).await?", kind: "neutral" },
      { text: "  Ok(ScanResult::Clean)", kind: "verified" }
    ]
  },

  /* ── CENTER-LEFT  (close, large) ────────────────────────────── */
  {
    id: "panel-e",
    fileName: "audit_pipeline.go",
    depth: 0.72,
    similarity: 87,
    className: "left-[1%] top-[42%] w-[clamp(220px,23vw,340px)]",
    statusCycle: ["Auditing...", "Comparing AST...", "Flagged"],
    lines: [
      { text: "func Audit(ctx context.Context) {", kind: "neutral" },
      { text: "  tree := ParseAST(source)", kind: "verified" },
      { text: "  diff := CompareTrees(tree, ref)", kind: "flagged" },
      { text: "  report.Append(diff.Score())", kind: "neutral" }
    ]
  },

  /* ── BOTTOM-RIGHT  (mid, medium) ────────────────────────────── */
  {
    id: "panel-f",
    fileName: "similarity_index.sql",
    depth: 0.4,
    similarity: 73,
    className: "right-[6%] bottom-[6%] w-[clamp(210px,21vw,310px)]",
    statusCycle: ["Indexing...", "Querying vectors...", "Complete"],
    lines: [
      { text: "SELECT fingerprint, score", kind: "neutral" },
      { text: "FROM code_vectors", kind: "neutral" },
      { text: "WHERE cosine_sim > 0.82", kind: "flagged" },
      { text: "ORDER BY score DESC LIMIT 20;", kind: "verified" }
    ]
  }
];

