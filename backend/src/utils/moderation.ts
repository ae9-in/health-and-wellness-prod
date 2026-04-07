import prisma from '../lib/prisma';

// ─── Comprehensive blocklist (English, Romanized Hindi, Romanized Kannada) ───
const BLOCKLIST_WORDS = [
  // English
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  // Romanized Hindi
  'mc', 'bc', 'bkl', 'lodu', 'chutiya', 'madarchod',
  'behenchod', 'randi', 'harami', 'gaandu', 'bhosdi', 'lavde', 'saala', 'kutte',
  // Kannada romanized
  'sule', 'maga', 'haramkhor',
];

// Build a single regex with alternation — case-insensitive, partial match
const BLOCKLIST_REGEX = new RegExp(BLOCKLIST_WORDS.join('|'), 'i');

export interface ModerationResult {
  safe: boolean;
  reason?: string;
}

/**
 * Synchronous blocklist check — runs instantly.
 * Returns { safe: false } if any blocked word is found.
 */
export function checkBlocklist(text: string): ModerationResult {
  if (BLOCKLIST_REGEX.test(text)) {
    return { safe: false, reason: 'Please keep the conversation respectful.' };
  }
  return { safe: true };
}

/**
 * Async HuggingFace toxicity check via free API.
 * Fires AFTER the comment is already saved (fail-open).
 * If toxicity > 0.8 → auto-hide the comment in DB.
 */
export async function checkToxicityAsync(commentId: string, text: string): Promise<void> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    // No token configured — silently skip
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/unitary/toxic-bert',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      // API returned an error — fail open
      console.warn(`HF API returned ${response.status}, skipping toxicity check`);
      return;
    }

    const data = await response.json();

    // toxic-bert returns: [[{ label: "toxic", score: 0.95 }, ...]]
    let toxicityScore = 0;
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const toxicLabel = data[0].find(
        (item: { label: string; score: number }) => item.label === 'toxic'
      );
      if (toxicLabel) {
        toxicityScore = toxicLabel.score;
      }
    }

    // Persist the score
    const updateData: any = { toxicityScore };

    if (toxicityScore > 0.8) {
      // Auto-hide highly toxic comments
      updateData.status = 'hidden';
      updateData.flagged = true;
      console.log(`[Moderation] Comment ${commentId} auto-hidden (toxicity: ${toxicityScore.toFixed(3)})`);
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: updateData,
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[Moderation] HF API timed out — failing open');
    } else {
      console.warn('[Moderation] HF API error — failing open:', error.message);
    }
    // Fail open — do nothing
  }
}
