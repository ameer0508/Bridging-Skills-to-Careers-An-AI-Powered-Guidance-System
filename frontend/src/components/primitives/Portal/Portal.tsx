import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
}

export const Portal: React.FC<PortalProps> = ({ children, containerId = 'portal-root' }) => {
  const [mounted, setMounted] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    let el = document.getElementById(containerId);
    let created = false;

    if (!el) {
      el = document.createElement('div');
      el.id = containerId;
      document.body.appendChild(el);
      created = true;
    }

    setTargetElement(el);

    return () => {
      if (created && el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, [containerId]);

  if (!mounted || !targetElement) {
    return null;
  }

  return createPortal(children, targetElement);
};

Portal.displayName = 'Portal';
