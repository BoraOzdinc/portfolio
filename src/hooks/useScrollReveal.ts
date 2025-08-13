import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

interface ScrollRevealOptions {
    rootMargin?: string;
    threshold?: number | number[];
    once?: boolean;
    distance?: number;
    duration?: number;
    delay?: number;
    staggerChildren?: boolean;
}

// Hook to animate a container and its children when it scrolls into view
export function useScrollReveal<T extends HTMLElement = HTMLElement>(options: ScrollRevealOptions = {}) {
    const {
        rootMargin = '0px 0px -10% 0px',
        threshold = 0.15,
        once = true,
        distance = 32,
        duration = 900,
        delay = 0,
        staggerChildren = true,
    } = options;

    const ref = useRef<T | null>(null);
    const hasPlayed = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // initial state
        const targets = staggerChildren ? Array.from(el.children) : [el];
        targets.forEach((child) => {
            (child as HTMLElement).style.opacity = '0';
            (child as HTMLElement).style.transform = `translateY(${distance}px)`;
        });

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (once && hasPlayed.current) return;
                        hasPlayed.current = true;
                        animate(staggerChildren ? targets : el, {
                            opacity: [0, 1],
                            translateY: [distance, 0],
                            easing: 'cubicBezier(0.22, 1, 0.36, 1)',
                            duration,
                            delay: staggerChildren ? stagger(120, { start: delay }) : delay,
                        });
                        if (once) io.disconnect();
                    }
                });
            },
            { root: null, rootMargin, threshold }
        );

        io.observe(el);
        return () => io.disconnect();
    }, [rootMargin, threshold, once, distance, duration, delay, staggerChildren]);

    return ref;
}
