import type { ReactNode } from "react";

import { maskStyle } from "@/app/_lib/mask";

/** The mark on the card back. The same file the header masks for its logo. */
const MONOGRAM_SRC = "/designally-monogram.svg";

/**
 * The default back: brand orange with the monogram centred.
 *
 * `contain`, not the stretch a fitted stencil uses — the monogram is dropped
 * into a square here and would distort.
 */
function BrandBack() {
  return (
    <div className="grid size-full place-items-center rounded-lg bg-action-primary">
      <div
        aria-hidden="true"
        className="size-2/5 bg-text-on-accent"
        style={maskStyle(MONOGRAM_SRC, "contain")}
      />
    </div>
  );
}

/**
 * A card that turns face-up as it arrives, and lifts under the pointer.
 *
 * The turn itself is CSS: `.flip-card` in globals.css rests at `rotate: y
 * 180deg` and is taken back to 0 by `[data-appear="pending"]`, which
 * reveal-on-view.tsx writes before paint. So this renders face-up by default
 * and a visitor with no JavaScript, a failed hydration or reduced motion sees
 * a finished card rather than its back.
 *
 * **It rests at 180deg, and that is the whole trick.** The face carrying
 * `rotate-y-180` has come round a full 360 by the end, so it is square to the
 * reader and NOT mirrored — that is where the content belongs. The plain face
 * shows at 0, while the card is still turned away, and carries the back.
 * use-situation-cards.ts argues this at length for the cards this copies.
 *
 * **Perspective and hover live on the outer wrapper, never on the element that
 * turns.** The flipper's transform belongs to the flip alone; a hover transform
 * on the same element would fight it. Same arrangement as the situation cards.
 *
 * **Both faces share ONE grid cell** rather than being absolutely positioned,
 * because a content card has no fixed ratio: the front defines the height from
 * its own words and the back stretches to match. Absolute faces would collapse
 * the box to nothing.
 *
 * **Neither face may carry `overflow-hidden`,** and a mask counts as one. A
 * non-visible overflow renders an element into its own flattened plane, which
 * can take it out of the parent's 3D context and stop `backface-visibility`
 * applying — and when that fails BOTH faces draw and the card rests looking
 * mirrored. Clip and mask inside a face, never on it.
 *
 * The child is the front and should fill its face — `h-full` on it, since the
 * face is a stretched grid item.
 */
export default function FlipCard({
  back,
  children,
}: {
  /** The turned-away face. Defaults to the brand back. */
  back?: ReactNode;
  /** The resting face: the card itself. */
  children: ReactNode;
}) {
  return (
    <div className="group relative h-full perspective-distant transition-[translate,rotate,scale] duration-[400ms] ease-out hover:z-10 hover:-translate-y-6 hover:scale-105 hover:rotate-3 motion-reduce:transition-none">
      <div className="flip-card relative grid h-full transform-3d">
        {/* The turned-away face FIRST, the resting face LAST. Paint order is
            the safety net: if `backface-visibility` ever fails, both faces draw
            and the later sibling wins — so the winner must be the one the card
            rests on. */}
        <div className="col-start-1 row-start-1 backface-hidden">
          {back ?? <BrandBack />}
        </div>
        <div className="col-start-1 row-start-1 rotate-y-180 backface-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
