import { useEffect, useRef, useState } from 'react';

const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const [active, setActive] = useState(false);

  useEffect(() => {
    document.body.classList.add('has-custom-cursor');
    return () => {
      document.body.classList.remove('has-custom-cursor');
    };
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = `${event.clientX}px`;
        dotRef.current.style.top = `${event.clientY}px`;
      }
    };

    const animateRing = () => {
      ringPos.current.x += (pointer.current.x - ringPos.current.x) * 0.18;
      ringPos.current.y += (pointer.current.y - ringPos.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.left = `${ringPos.current.x}px`;
        ringRef.current.style.top = `${ringPos.current.y}px`;
      }
      animationRef.current = requestAnimationFrame(animateRing);
    };

    animationRef.current = requestAnimationFrame(animateRing);
    document.addEventListener('pointermove', handlePointerMove);

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      const hoverable = Boolean(target.closest('button, .cursor-grow'));
      setActive(hoverable);
    };

    const handlePointerOut = (event: PointerEvent) => {
      const related = event.relatedTarget as HTMLElement | null;
      if (!related || !related.closest('button, .cursor-grow')) {
        setActive(false);
      }
    };

    document.addEventListener('pointerover', handlePointerOver);
    document.addEventListener('pointerout', handlePointerOut);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className={`custom-cursor-dot ${active ? 'cursor-active' : ''}`}
        style={{ left: 0, top: 0 }}
      />
      <div
        ref={ringRef}
        className={`custom-cursor-ring ${active ? 'cursor-active' : ''}`}
        style={{ left: 0, top: 0 }}
      />
    </>
  );
};

export default CustomCursor;
