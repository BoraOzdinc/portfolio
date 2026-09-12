import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const section = hash ? document.getElementById(hash.slice(1)) : null;

      if (section) {
        section.scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}
