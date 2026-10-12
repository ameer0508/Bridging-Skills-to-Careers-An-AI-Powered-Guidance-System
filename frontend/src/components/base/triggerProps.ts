import type React from 'react';

/**
 * Props that Tooltip, Popover and DropdownMenu read from (and re-attach to) the single
 * element they wrap. Any element accepting these standard handlers can be a trigger.
 */
export interface TriggerProps {
  ref?: React.Ref<HTMLElement>;
  onClick?: (event: React.MouseEvent) => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
}

export type TriggerElement = React.ReactElement<TriggerProps>;

/** Forwards a DOM node to whatever kind of ref the wrapped element already had. */
export const assignRef = (ref: React.Ref<HTMLElement> | undefined, node: HTMLElement | null): void => {
  if (typeof ref === 'function') ref(node);
  else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
};
