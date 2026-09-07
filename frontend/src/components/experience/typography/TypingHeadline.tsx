import React, { useState, useEffect } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface TypingHeadlineProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export const TypingHeadline: React.FC<TypingHeadlineProps> = ({
  phrases,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 2000,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [displayedText, setDisplayedText] = useState<string>('');
  const [phraseIndex, setPhraseIndex] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (prefersReducedMotion || phrases.length === 0) {
      setDisplayedText(phrases[0] || '');
      return;
    }

    const currentPhrase = phrases[phraseIndex];

    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayedText.length < currentPhrase.length) {
      timer = setTimeout(() => {
        setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
      }, typingSpeed);
    } else if (!isDeleting && displayedText.length === currentPhrase.length) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
    } else if (isDeleting && displayedText.length > 0) {
      timer = setTimeout(() => {
        setDisplayedText(currentPhrase.slice(0, displayedText.length - 1));
      }, deletingSpeed);
    } else if (isDeleting && displayedText.length === 0) {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }

    return () => clearTimeout(timer);
  }, [displayedText, phraseIndex, isDeleting, phrases, typingSpeed, deletingSpeed, pauseDuration, prefersReducedMotion]);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span>{displayedText}</span>
      {!prefersReducedMotion && (
        <span className="inline-block w-[2px] h-[1em] ml-1 bg-indigo-500 animate-pulse" />
      )}
    </span>
  );
};

export default TypingHeadline;
