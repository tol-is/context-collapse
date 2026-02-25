import "phaser";
import "./style.css";
import TitleScene from "./scenes/TitleScene";
import ClassSelectScene from "./scenes/ClassSelectScene";
import GameScene from "./scenes/GameScene";
import GameOverScene from "./scenes/GameOverScene";
import VictoryScene from "./scenes/VictoryScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game-container",
  backgroundColor: "#080809",
  scene: [TitleScene, ClassSelectScene, GameScene, GameOverScene, VictoryScene],
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
