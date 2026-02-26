import type { SystemPrompt } from "./objects/Cursor";

interface DevConfig {
  /** Master toggle — set false to disable all dev shortcuts */
  enabled: boolean;

  /** Skip the title screen entirely */
  skipTitle: boolean;

  /** Auto-select a class and skip ClassSelectScene (null = show picker) */
  defaultClass: SystemPrompt | null;

  /**
   * Jump straight to a scene on boot.
   * 'GameScene' | 'GameOverScene' | 'VictoryScene' | null
   */
  startScene: "GameScene" | "GameOverScene" | "VictoryScene" | null;

  /** Starting layer when jumping to GameScene (1-21) */
  startLayer: number;

  /**
   * In-game hotkeys (active only during GameScene):
   *   K — kill all enemies & boss, advance layer
   *   V — jump to VictoryScene
   *   G — jump to GameOverScene
   *   N — advance tAo next layer (without killing)
   */
}

const DEV: DevConfig = {
  enabled: false,

  skipTitle: true,
  defaultClass: "jailbreak",
  startScene: null,
  startLayer: 1,
};

export default DEV;
