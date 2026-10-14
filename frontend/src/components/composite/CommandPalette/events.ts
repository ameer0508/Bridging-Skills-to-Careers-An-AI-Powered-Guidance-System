/** Window event that asks the app shell to open the command palette. */
export const OPEN_COMMAND_PALETTE_EVENT = 'skillbridge:open-command-palette';

export const openCommandPalette = () => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
