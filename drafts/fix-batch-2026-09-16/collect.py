#!/usr/bin/env python3
"""Collect per-bug workflow results into a ledger and gated comment drafts.

Usage: collect.py <tasks-dir>   (the directory that holds w*.output JSON files)
Writes ledger.md and comment-<key>.md next to this script.
"""
import html
import json
import pathlib
import sys

tasks = pathlib.Path(sys.argv[1])
out = pathlib.Path(__file__).resolve().parent
rows = []
for f in sorted(tasks.glob("w*.output")):
    if f.stat().st_size == 0:
        continue
    try:
        data = json.loads(f.read_text())
    except json.JSONDecodeError:
        continue
    res = data.get("result") or data
    if isinstance(res, str):
        try:
            res = json.loads(res)
        except json.JSONDecodeError:
            continue
    key = res.get("key")
    if not key:
        continue
    tri = res.get("triage") or {}
    rows.append((str(key), res.get("stage", ""), res.get("status", ""),
                 tri.get("confidence", ""), " ".join(tri.get("reason", "").split())))
    draft = html.unescape(tri.get("commentDraft") or "").strip()
    if draft and res.get("status") == "no-go":
        (out / f"comment-{key}.md").write_text(draft + "\n")

lines = ["# Fix batch 2026-09-16 ledger", "",
         "| key | stage | status | triage confidence | reason |", "|---|---|---|---|---|"]
for r in sorted(rows):
    lines.append("| " + " | ".join(c.replace("|", "/") for c in r) + " |")
(out / "ledger.md").write_text("\n".join(lines) + "\n")
print(f"{len(rows)} results")
