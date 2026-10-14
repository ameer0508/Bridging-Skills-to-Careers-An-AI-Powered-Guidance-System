import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
  /** Accepted for compatibility; every portal renders in the light Aurora Elite design. */
  theme?: 'aurora';
}

export const Portal: React.FC<PortalProps> = ({ children, containerId }) => {
  const [mounted, setMounted] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const id = containerId ?? 'portal-root';

  useEffect(() => {
    setMounted(true);
    let el = document.getElementById(id);
    let created = false;

    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'sb-aurora';
      document.body.appendChild(el);
      created = true;
    }

    setTargetElement(el);

    return () => {
      if (created && el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, [id]);

  if (!mounted || !targetElement) {
    return null;
  }

  return createPortal(children, targetElement);
};

Portal.displayName = 'Portal';
