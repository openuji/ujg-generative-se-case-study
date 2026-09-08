import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { pages } from "./slides";

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
  const page = pages[pageIndex];
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === pages.length - 1;

  const goTo = useCallback((nextIndex: number, replace = false) => {
    const boundedIndex = Math.max(0, Math.min(pages.length - 1, nextIndex));
    setPageIndex(boundedIndex);
    setPageHash(boundedIndex, replace);
  }, []);

  const next = useCallback(() => {
    goTo(pageIndex + 1);
  }, [goTo, pageIndex]);

  const previous = useCallback(() => {
    goTo(pageIndex - 1);
  }, [goTo, pageIndex]);

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
          aria-label={`Slide ${page.conceptualSlide}, step ${page.step}`}
        >
          <header className="slide-header">
            {page.eyebrow ? <p className="eyebrow">{page.eyebrow}</p> : null}
            <h1>{page.title}</h1>
          </header>
          <div className="slide-content">{page.content}</div>
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
