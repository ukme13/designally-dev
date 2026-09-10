import { ClappingHandsIcon } from "@/app/_components/icons";

/**
 * The "we should have a convo!" sticker from designally.co's online brand
 * guide: three handwritten lines and a pair of clapping hands, set at an angle.
 *
 * ── The knobs ────────────────────────────────────────────────────────────
 *   the tilt    ANGLE
 *   the size    TYPE and MARK
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Copy and mark both come from that page, which is Designally's own — the words
 * are quoted exactly and the hands are its inline SVG traced path for path. The
 * line breaks are the page's too: they give the block its stepped shape, which
 * is most of what makes it read as a sticker rather than a caption.
 *
 * **Real text, not an image.** It is a sentence inviting the reader to get in
 * touch, so it is selectable, searchable and read out. Only the hands are
 * decorative, and they say so.
 *
 * No colour of its own: the type and the mark both inherit, so the sticker
 * takes the ink of whatever it is dropped into. `currentColor` in the icon is
 * what makes that work.
 *
 * The tilt is a `rotate`, so it costs no layout — the block reserves its
 * upright box and leans within it. `w-fit` keeps that box to the text, so a
 * caller can push it around with margins without a stray column of air.
 */

/** The lean. Small: past about 8 degrees the handwriting starts to look fallen. */
const ANGLE = "-rotate-6";
/**
 * Caveat, 24px stepping to the accent scale's large 32px.
 *
 * Stepped because the sticker sits inside the image it is stuck to: at 32px the
 * longest line is about 294px, which on a 375px phone leaves nothing either
 * side of a 327px image once the inset is taken off.
 */
const TYPE = "font-accent text-accent-md lg:text-accent-lg";
/** The hands, a little under the type's three lines. */
const MARK = "size-16 lg:size-20";

export default function ConvoSticker({ className }: { className?: string }) {
  return (
    <div
      className={`flex w-fit flex-col items-center gap-2 ${ANGLE}${className ? ` ${className}` : ""}`}
    >
      <p className={`text-center ${TYPE}`}>
        If you are looking
        <br />
        for a website creator,
        <br />
        we should have a convo!
      </p>
      <ClappingHandsIcon className={MARK} />
    </div>
  );
}
