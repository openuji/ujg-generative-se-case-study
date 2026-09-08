import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { pages } from "./slides";
import type { DeckPage } from "./types";

type RevealDirection = "forward" | "backward";

function boundedRevealStep(page: DeckPage, revealStep: number) {
  return Math.max(0, Math.min(page.revealCount ?? 0, revealStep));
}

function defaultRevealStep(page: DeckPage, direction?: RevealDirection) {
  if (!page.revealCount) {
    return 0;
  }

  return direction === "backward" ? page.revealCount : 0;
}

function indexFromHash() {
  const id = window.location.hash.replace(/^#/, "");
  const index = pages.findIndex((page) => page.id === id);
  return index >= 0 ? index : 0;
}

function setPageHash(index: number, replace = false) {
  const page = pages[index];
  const nextHash = `#${page.id}`;

  if (window.location.hash === nextHash) {
    return;
  }

  if (replace) {
    window.history.replaceState(null, "", nextHash);
    return;
  }

  window.location.hash = nextHash;
}

export function App() {
  const [pageIndex, setPageIndex] = useState(() => indexFromHash());
  const [revealSteps, setRevealSteps] = useState<Record<string, number>>({});
  const page = pages[pageIndex];
  const revealCount = page.revealCount ?? 0;
  const revealStep = boundedRevealStep(
    page,
    revealSteps[page.id] ?? defaultRevealStep(page)
  );
  const hasPreviousReveal = revealStep > 0;
  const hasNextReveal = revealStep < revealCount;
  const isFirst = pageIndex === 0 && !hasPreviousReveal;
  const isLast = pageIndex === pages.length - 1 && !hasNextReveal;

  const setPageRevealStep = useCallback(
    (targetPage: DeckPage, nextRevealStep: number) => {
      const nextStep = boundedRevealStep(targetPage, nextRevealStep);

      setRevealSteps((current) => {
        if (current[targetPage.id] === nextStep) {
          return current;
        }

        return {
          ...current,
          [targetPage.id]: nextStep
        };
      });
    },
    []
  );

  const goTo = useCallback(
    (nextIndex: number, replace = false, direction?: RevealDirection) => {
      const boundedIndex = Math.max(0, Math.min(pages.length - 1, nextIndex));

      if (boundedIndex === pageIndex) {
        setPageHash(boundedIndex, replace);
        return;
      }

      const targetPage = pages[boundedIndex];
      const resolvedDirection =
        direction ?? (boundedIndex > pageIndex ? "forward" : "backward");

      if (targetPage.revealCount) {
        setPageRevealStep(
          targetPage,
          defaultRevealStep(targetPage, resolvedDirection)
        );
      }

      setPageIndex(boundedIndex);
      setPageHash(boundedIndex, replace);
    },
    [pageIndex, setPageRevealStep]
  );

  const next = useCallback(() => {
    if (hasNextReveal) {
      setPageRevealStep(page, revealStep + 1);
      return;
    }

    goTo(pageIndex + 1, false, "forward");
  }, [goTo, hasNextReveal, page, pageIndex, revealStep, setPageRevealStep]);

  const previous = useCallback(() => {
    if (hasPreviousReveal) {
      setPageRevealStep(page, revealStep - 1);
      return;
    }

    goTo(pageIndex - 1, false, "backward");
  }, [
    goTo,
    hasPreviousReveal,
    page,
    pageIndex,
    revealStep,
    setPageRevealStep
  ]);

  const content = useMemo(
    () =>
      typeof page.content === "function"
        ? page.content({ revealStep })
        : page.content,
    [page, revealStep]
  );

  const indicator = useMemo(
    () =>
      `${page.conceptualSlide} / ${page.conceptualSlideCount} - ${page.step} / ${page.stepCount}`,
    [page.conceptualSlide, page.conceptualSlideCount, page.step, page.stepCount]
  );

  useEffect(() => {
    if (!window.location.hash) {
      setPageHash(pageIndex, true);
    }

    const syncFromHash = () => {
      setPageIndex(indexFromHash());
    };

    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [pageIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      }

      if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      }

      if (event.key === "End") {
        event.preventDefault();
        goTo(pages.length - 1);
      }

      if (event.key.toLowerCase() === "f" && document.fullscreenEnabled) {
        event.preventDefault();
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else {
          void document.documentElement.requestFullscreen();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, next, previous]);

  return (
    <main className="viewport-shell">
      <div className="slide-fit">
        <section
          className={`slide slide-${page.layout}`}
          aria-label={`Slide ${page.conceptualSlide}, step ${page.step}${
            revealCount > 0 ? `, reveal ${revealStep} of ${revealCount}` : ""
          }`}
        >
          <header className="slide-header">
            {page.eyebrow ? <p className="eyebrow">{page.eyebrow}</p> : null}
            <h1>{page.title}</h1>
          </header>
          <div className="slide-content">{content}</div>
        </section>
      </div>

      <button
        className="edge-nav edge-nav-left"
        type="button"
        aria-label="Previous slide"
        onClick={previous}
        disabled={isFirst}
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <button
        className="edge-nav edge-nav-right"
        type="button"
        aria-label="Next slide"
        onClick={next}
        disabled={isLast}
      >
        <ChevronRight aria-hidden="true" />
      </button>
      <button
        className="fullscreen-button"
        type="button"
        aria-label="Toggle fullscreen"
        onClick={() => {
          if (!document.fullscreenEnabled) {
            return;
          }

          if (document.fullscreenElement) {
            void document.exitFullscreen();
          } else {
            void document.documentElement.requestFullscreen();
          }
        }}
      >
        <Maximize2 aria-hidden="true" />
      </button>
      <div className="slide-indicator" aria-label="Slide position">
        {indicator}
      </div>
    </main>
  );
}
