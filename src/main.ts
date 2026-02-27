import "phaser";
import "./style.css";
import TitleScene from "./scenes/TitleScene";
import ClassSelectScene from "./scenes/ClassSelectScene";
import GameScene from "./scenes/GameScene";
import GameOverScene from "./scenes/GameOverScene";
import VictoryScene from "./scenes/VictoryScene";
import CodexScene from "./scenes/CodexScene";
import EvalModeScene from "./scenes/EvalModeScene";
import DEV from "./devConfig";

const scenes = [
  TitleScene,
  ClassSelectScene,
  GameScene,
  GameOverScene,
  VictoryScene,
  CodexScene,
  EvalModeScene,
];

if (DEV.enabled && DEV.startScene) {
  const sceneMap: Record<string, (typeof scenes)[number]> = {
    GameScene,
    GameOverScene,
    VictoryScene,
    CodexScene,
  };
  const target = sceneMap[DEV.startScene];
  if (target) {
    const idx = scenes.indexOf(target);
    if (idx > 0) {
      scenes.splice(idx, 1);
      scenes.unshift(target);
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game-container",
  backgroundColor: "#080809",
  scene: scenes,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
};

export let game: Phaser.Game;

document.fonts.load('16px "Share Tech Mono"').then(() => {
  game = new Phaser.Game(config);
  (window as any).game = game;
});
