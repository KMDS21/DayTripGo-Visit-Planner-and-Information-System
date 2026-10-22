"use client";
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import { IconChevronLeft, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";

interface CarouselProps {
  items: JSX.Element[];
  initialScroll?: number;
}

type Card = {
  src: string;
  title: string;
  category: string;
  content: React.ReactNode;
};

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => {},
  currentIndex: 0,
});

export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
    }
  }, [initialScroll]);

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 230 : 384; // (md:w-96)
      const gap = isMobile() ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const isMobile = () => {
    return window && window.innerWidth < 768;
  };

  // The left "back" arrow under the carousel fades in after load (the cards'
  // entrance animation has had time to play).
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 900);
    return () => clearTimeout(timer);
  }, []);

  // One card plus row gap per step (w-56 / w-96 plus the gap-4 spacing).
  const stepSize = () => (isMobile() ? 240 : 400);

  // Frame-driven, eased scroll. Native smooth scrolling has no control over
  // duration or easing (and differs per browser), so every glide below is
  // animated by hand for a consistent, gentle motion. `onDone` (optional) is
  // called on the very frame the glide lands, so follow-up work (the loop
  // wrap) can never race the animation's last frame.
  const scrollAnimRef = useRef<(() => void) | null>(null);
  const animateScrollTo = (targetLeft: number, duration: number, onDone?: () => void) => {
    const el = carouselRef.current;
    if (!el) return;
    scrollAnimRef.current?.(); // stop any glide already running
    const start = el.scrollLeft;
    const delta = targetLeft - start;
    if (Math.abs(delta) < 1) {
      onDone?.();
      return;
    }

    const startTime = performance.now();
    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      el.scrollLeft = start + delta * easeInOut(t);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        scrollAnimRef.current = null;
        onDone?.();
      }
    };
    frame = requestAnimationFrame(tick);
    scrollAnimRef.current = () => {
      cancelAnimationFrame(frame);
      scrollAnimRef.current = null;
    };
  };

  // A duplicate of every card is appended after the real ones so the row can
  // wrap around seamlessly: the automatic glide lands on the first clone (an
  // exact copy of the real first card) and then snaps back to the real start,
  // which looks identical, so the leftward flow never breaks or rewinds.
  const loopItems =
    items.length > 1
      ? [
          ...items,
          ...items.map((item, index) => React.cloneElement(item, { key: `clone-${index}` })),
        ]
      : items;

  // Left animation: once the staggered fade-up entrance has finished playing,
  // the row glides one card to the left at a time, forever, wrapping from the
  // clones back to the real first card. The moment the visitor scrolls by
  // hand, drags, or taps an arrow / dot, control goes back to them.
  const [autoLeft, setAutoLeft] = useState(true);
  useEffect(() => {
    if (!autoLeft || items.length < 2) return;

    // Wait out the last card's entrance (0.2s per card plus its own duration).
    const startAfter = 200 * items.length + 600;
    let step = 0;
    let timer: number | undefined;

    const advance = () => {
      const el = carouselRef.current;
      if (!el) return;
      const size = stepSize();
      const max = el.scrollWidth - el.clientWidth;
      const loopWidth = items.length * size;
      // Too little to scroll, or not enough room to wrap around seamlessly:
      // leave the row where it is.
      if (max <= size / 2 || max < loopWidth - 4) return;

      const atWrap = step + 1 >= items.length; // next stop is the first clone
      step += 1;
      const target = Math.min(max, step * size);

      if (atWrap) {
        // Glide onto the cloned copy of the first card, then — on the very
        // frame the glide lands — rewind by exactly one loop width. The frame
        // shown is pixel-identical (clone of card 1 == card 1), so the row
        // keeps flowing left for ever with no visible step back.
        animateScrollTo(target, 1400, () => {
          const node = carouselRef.current;
          if (node) node.scrollLeft = Math.max(0, node.scrollLeft - loopWidth);
          step = 0;
          timer = window.setTimeout(advance, 1200);
        });
        return;
      }

      animateScrollTo(target, 1400);
      timer = window.setTimeout(advance, 2600); // 1.4s glide + a pause
    };

    timer = window.setTimeout(advance, startAfter);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [autoLeft, items.length]);

  // Cancel any running glide when the carousel unmounts.
  useEffect(() => () => scrollAnimRef.current?.(), []);

  // Any manual interaction stops the automatic left glide.
  const stopAutoLeft = () => {
    scrollAnimRef.current?.();
    setAutoLeft(false);
  };

  // Dot navigation: the highlighted dot always matches the card sitting at the
  // left edge of the row — real cards and the loop's cloned ("iteration")
  // cards alike, since the clones map back onto the same dots by position.
  // Floor (not round) with a 2px tolerance: the dot flips the instant the next
  // card reaches the left edge, never halfway through a glide, so it never
  // runs ahead of — or back to the first card before — the card on screen.
  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el || !items.length) return;
    const raw = Math.floor((el.scrollLeft + 2) / stepSize());
    const index = ((raw % items.length) + items.length) % items.length; // wraps both ways
    setCurrentIndex(index);
  };

  const goToSlide = (index: number) => {
    stopAutoLeft();
    setCurrentIndex(index);
    animateScrollTo(index * stepSize(), 700);
  };

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-2 [scrollbar-width:none] md:py-6"
          ref={carouselRef}
          onScroll={handleScroll}
          onPointerDown={stopAutoLeft}
          onWheel={(event) => {
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) stopAutoLeft();
          }}
        >
          <div
            className={cn(
              "absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l",
            )}
          ></div>

          <div
            className={cn(
              "flex flex-row justify-start gap-4",
              "max-w-7xl", // left-flush (no pl/mx-auto): the first card starts at the corner
            )}
          >
            {loopItems.map((item, index) => {
              // The appended clones are already past the fold, so they skip
              // the staggered entrance and simply sit in place.
              const isClone = index >= items.length;
              return (
                <motion.div
                  initial={isClone ? false : { opacity: 0, y: 20 }}
                  animate={
                    isClone
                      ? undefined
                      : {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 0.5,
                            delay: 0.2 * index,
                            ease: "easeOut",
                          },
                        }
                  }
                  key={"card" + index}
                  className="rounded-3xl last:pr-[5%] md:last:pr-[33%]"
                >
                  {item}
                </motion.div>
              );
            })}
          </div>
        </div>
        {/* Row under the carousel: the centred dots (kept as-is) plus a left
            "back" arrow at the edge, fading in after the carousel loads. */}
        <div className="relative flex items-center justify-center gap-2 pb-2">
          <button
            type="button"
            aria-label="Scroll featured cards left"
            disabled={currentIndex === 0}
            onClick={() => {
              stopAutoLeft();
              const el = carouselRef.current;
              if (el) animateScrollTo(Math.max(0, el.scrollLeft - stepSize()), 700);
            }}
            className={cn(
              "absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-all duration-500 hover:text-brand",
              !loaded && "pointer-events-none opacity-0",
              loaded && currentIndex === 0 && "opacity-40",
            )}
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          {items.map((_, index) => (
            <button
              key={index}
              aria-label={`Go to featured card ${index + 1}`}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-6 bg-brand"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
            />
          ))}
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

export const Card = ({
  card,
  index,
  layout = false,
}: {
  card: Card;
  index: number;
  layout?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { onCardClose } = useContext(CarouselContext);

  // Defined before the effects below so they never read it mid-initialisation.
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    onCardClose(index);
  };

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      // Restore the previous value (empty string = default), not a hard-coded
      // "auto" which could override a page that had locked scrolling itself.
      document.body.style.overflow = "";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useOutsideClick(containerRef, () => handleClose());

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={containerRef}
              layoutId={layout ? `card-${card.title}` : undefined}
              className="relative z-[60] mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 font-sans md:p-10 dark:bg-neutral-900"
            >
              <button
                className="sticky top-4 right-0 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black dark:bg-white"
                onClick={handleClose}
              >
                <IconX className="h-6 w-6 text-neutral-100 dark:text-neutral-900" />
              </button>
              <motion.p
                layoutId={layout ? `category-${card.title}` : undefined}
                className="text-base font-medium text-black dark:text-white"
              >
                {card.category}
              </motion.p>
              <motion.p
                layoutId={layout ? `title-${card.title}` : undefined}
                className="mt-4 text-2xl font-semibold text-neutral-700 md:text-5xl dark:text-white"
              >
                {card.title}
              </motion.p>
              <div className="py-10">{card.content}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        className="relative z-10 flex h-[22rem] w-56 flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 sm:h-[26rem] md:h-[28rem] md:w-96 lg:h-[32rem] xl:h-[36rem] dark:bg-neutral-900"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        <div className="relative z-40 p-8">
          <motion.p
            layoutId={layout ? `category-${card.category}` : undefined}
            className="text-left font-sans text-sm font-medium text-white md:text-base"
          >
            {card.category}
          </motion.p>
          <motion.p
            layoutId={layout ? `title-${card.title}` : undefined}
            className="mt-2 max-w-xs text-left font-sans text-xl font-semibold [text-wrap:balance] text-white md:text-3xl"
          >
            {card.title}
          </motion.p>
        </div>
        <BlurImage
          src={card.src}
          alt={card.title}
          className="absolute inset-0 z-10 object-cover"
        />
      </motion.button>
    </>
  );
};

// Local image props (the original Aceternity code typed this against
// next/image's ImageProps; this project is Vite + plain <img>).
type BlurImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  height?: number | string;
  width?: number | string;
  src: string;
};

export const BlurImage = ({
  height,
  width,
  src,
  className,
  alt,
  ...rest
}: BlurImageProps) => {
  const [isLoading, setLoading] = useState(true);
  return (
    <img
      className={cn(
        "h-full w-full transition duration-300",
        isLoading ? "blur-sm" : "blur-0",
        className,
      )}
      onLoad={() => setLoading(false)}
      src={src as string}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      alt={alt ? alt : "Background of a beautiful view"}
      {...rest}
    />
  );
};
