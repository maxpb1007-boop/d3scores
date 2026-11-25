"""Write a phone-friendly recording sheet for an episode: one section per character, every line numbered,
with acting notes. Usage: python3 scripts/line_sheet.py <ep>  ->  recording/<ep>_line_sheet.md"""
import json, sys, os
ep = sys.argv[1]
s = json.load(open(f"src/episodes/{ep}/script.json"))
NOTES = s.get("actingNotes", {})
os.makedirs("recording", exist_ok=True)
out = [f"# Recording sheet — {s.get('title', ep)}\n",
       "**How to record (one voice memo per character):**",
       "1. Quiet room, phone about a hand-width from your mouth, no music/TV.",
       "2. Read that character's lines **in order**, top to bottom.",
       "3. After each line, **pause 2 seconds** (silently count \"one-two\").",
       "4. Messed up? Stop and start that memo over — don't re-say a line mid-memo.",
       "5. Send each memo here and tell me whose it is (e.g. \"Gus\").\n"]
for spk in dict.fromkeys(L["speaker"] for L in s["lines"]):
    sents = [(L["id"], x) for L in s["lines"] if L["speaker"] == spk for x in L["sentences"]]
    out.append(f"\n## {spk.upper()} — {len(sents)} lines")
    if spk in NOTES:
        out.append(f"*{NOTES[spk]}*\n")
    for i, (lid, x) in enumerate(sents, 1):
        note = f"  _({x['note']})_" if x.get("note") else ""
        out.append(f"{i}. {x['text']}{note}")
open(f"recording/{ep}_line_sheet.md", "w").write("\n".join(out) + "\n")
print(f"recording/{ep}_line_sheet.md")
