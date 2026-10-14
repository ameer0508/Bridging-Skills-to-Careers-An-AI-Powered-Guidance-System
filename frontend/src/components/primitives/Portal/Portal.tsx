import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
  /** The design the portal content belongs to: still-dark screens, or Aurora Elite (light). */
  theme?: 'legacy-dark' | 'aurora';
}

export const Portal: React.FC<PortalProps> = ({ children, containerId, theme = 'legacy-dark' }) => {
  const [mounted, setMounted] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const id = containerId ?? (theme === 'aurora' ? 'aurora-portal-root' : 'portal-root');

  useEffect(() => {
    setMounted(true);
    let el = document.getElementById(id);
    let created = false;

    if (!el) {
      el = document.createElement('div');
      el.id = id;
      // Portal content keeps its own (dark) design inside the Aurora shell: see main.css
      el.className = theme === 'aurora' ? 'sb-aurora' : 'sb-legacy-dark';
      document.body.appendChild(el);
      created = true;
    }

    setTargetElement(el);

    return () => {
      if (created && el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, [id, theme]);

  if (!mounted || !targetElement) {
    return null;
  }

  return createPortal(children, targetElement);
};

Portal.displayName = 'Portal';
