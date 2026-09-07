export type HeroState =
  | 'idle'
  | 'background_settling'
  | 'greeting_reveal'
  | 'briefing_typing'
  | 'mission_reveal'
  | 'progress_ring_reveal'
  | 'interactive_ready';

export interface HeroStateMachineConfig {
  onStateChange?: (state: HeroState) => void;
}

export class HeroStateMachine {
  private state: HeroState = 'idle';
  private listener?: (state: HeroState) => void;

  constructor(config?: HeroStateMachineConfig) {
    this.listener = config?.onStateChange;
  }

  public getState(): HeroState {
    return this.state;
  }

  public transitionTo(newState: HeroState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.listener?.(this.state);
  }

  public reset(): void {
    this.state = 'idle';
    this.listener?.(this.state);
  }
}
