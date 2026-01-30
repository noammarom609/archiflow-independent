import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export function SplitText({ children, delay = 0, stagger = 0.03, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const text = typeof children === 'string' ? children : children?.toString() || '';
  const words = text.split(' ');

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block">
          {word.split('').map((char, j) => (
            <motion.span
              key={j}
              className="inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                delay: delay + i * stagger + j * (stagger / 2),
                type: "spring",
                stiffness: 100,
                damping: 12,
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
          {i < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </span>
  );
}

export default SplitText;

