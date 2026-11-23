/*
 * RETIME: lets the voice change speed without re-cutting the episode by hand.
 *
 * Shots are cut against the timeline they were written for ("edit timeline", saved as
 * timeline_shots.json). When the voice is regenerated (faster, slower, a re-recorded line),
 * timeline.json changes. This builds matching anchor points from both timelines — the start of
 * every line, the onset of every word, every line end and pause end — and maps a frame of the
 * NEW video back onto the edit timeline by straight-line interpolation between anchors.
 * So every cut, pose change and camera move still lands on the same word it was aimed at.
 *
 * Rounded to whole frames so frame-parity effects (camera shake) keep working. Speech only ever
 * gets shorter or longer as a whole, never re-ordered, so the anchors are always in order.
 */
type TL = {
  lines: { startFrame: number; endFrame: number; postEndFrame: number; sentences: { words: { frame: number }[] }[] }[];
  blackStart: number; endCardStart: number; durationInFrames: number;
};

const anchors = (t: TL) => {
  const a: number[] = [0];
  for (const L of t.lines) {
    a.push(L.startFrame);
    for (const s of L.sentences) for (const w of s.words) a.push(w.frame);
    a.push(L.endFrame, L.postEndFrame);
  }
  a.push(t.blackStart, t.endCardStart, t.durationInFrames);
  return a;
};

export const makeRetime = (edit: TL, now: TL) => {
  const from = anchors(now);
  const to = anchors(edit);
  if (from.length !== to.length) throw new Error("retime: timelines have different word counts — re-cut the shots");
  return (f: number) => {
    let i = 0;
    while (i < from.length - 2 && from[i + 1] <= f) i++;
    const span = from[i + 1] - from[i];
    const k = span > 0 ? (f - from[i]) / span : 0;
    return Math.round(to[i] + (to[i + 1] - to[i]) * Math.min(1, Math.max(0, k)));
  };
};
