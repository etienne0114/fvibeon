/* Decides which remote participants get real video in a mesh call — the core
   of "smart mesh limits". Mesh bandwidth grows with participant count squared,
   so past a few people, sending full video to everyone stops being viable.
   Instead: only a bounded "focus set" gets video (structured mode's current
   speaker always included, then whoever's been talking most recently, then
   fill by join order for a stable default). Everyone outside it is still
   fully present on audio — just shown as an avatar tile instead of video.

   Every client computes this from the same shared inputs (server-recorded
   current speaker, broadcast SPEAKING signals, server-ordered participant
   list) so it converges to the same set on all sides — that's what lets each
   client safely stop *sending* video to anyone outside their peers' focus
   sets without a central coordinator. */

export const MAX_FOCUS_VIDEO = 6;

export function computeFocusSet(params: {
  currentSpeakerId: string | null;
  lastSpokeAt: Map<string, number>;
  joinOrder: string[];
  maxFocus?: number;
}): Set<string> {
  const { currentSpeakerId, lastSpokeAt, joinOrder, maxFocus = MAX_FOCUS_VIDEO } = params;
  const ordered: string[] = [];

  if (currentSpeakerId) ordered.push(currentSpeakerId);

  const byRecency = [...lastSpokeAt.entries()]
    .filter(([id]) => !ordered.includes(id))
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  ordered.push(...byRecency);

  for (const id of joinOrder) {
    if (!ordered.includes(id)) ordered.push(id);
  }

  return new Set(ordered.slice(0, maxFocus));
}
