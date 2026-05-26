import { useEffect, useRef } from 'react';

export function useScrollReveal(selector: string = '.scroll-reveal-item', enabled: boolean = true) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -50px 0px', threshold: 0.08 },
    );

    const timeoutId = setTimeout(() => {
      const items = container.querySelectorAll(selector);
      items.forEach((item, index) => {
        (item as HTMLElement).style.transitionDelay = `${index * 0.06}s`;
        observer.observe(item);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [selector, enabled]);

  return ref;
}
