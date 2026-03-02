import { zzfx, ZZFX } from 'zzfx';

const SFX = {
  shoot:           [.07,,400,.003,.005,.012,0,0,-6,,,,,,,,,.3],
  shootSpread:     [.055,,280,.003,.006,.01,0,0,-3,,,,,,,,,.2],
  shootHeavy:      [.09,,180,.005,.008,.018,2,.4,-3,,,,,,,,,.3],
  shootRapid:      [.04,,370,.001,.003,.005,0,0,-5,,,,,,,,,.15],
  shootChain:      [.055,,460,.003,.005,.012,0,.2,-12,,,,,,,,,.2],
  shootNova:       [.07,,160,.005,.007,.015,2,.3,-4,,,,,,,,,.2],
  shootVortex:     [.05,,290,.003,.005,.01,0,.3,-3,,,,,,,,,.15],
  shootOrbital:    [.08,,130,.006,.01,.02,2,.5,3,,,,,,,,,.25],
  shootRailgun:    [.1,,100,.003,.012,.03,2,.6,-10,,,,,,,,,.3],
  shootShockwave:  [.08,,145,.004,.008,.02,2,.4,-2,,,,,,,,,.2],
  shootExplosive:  [.085,,155,.005,.008,.025,2,.7,-4,,,,,,,,,.25],
  shootLaser:      [.035,,550,.001,.002,.004,0,0,-12,,,,,,,,,.12],
  shootHoming:     [.055,,340,.003,.005,.012,0,0,-6,,,,,,,,,.2],
  shootPiercing:   [.07,,450,.003,.005,.01,0,0,-10,,,,,,,,,.3],

  enemyHit:        [.12,.05,900,,.01,.01,0,0,-30,,,,,,,,,.7],
  enemyDeath:      [.25,,250,,.04,.12,4,1.5,,,-50,.04,,,,,,.4],
  bossHit:         [.2,,380,,.02,.04,2,.8,-6,,,,,,,,,.5],
  bossPhase:       [.4,,100,.08,.2,.35,2,2,-2,,,,.15,2,,,,,.06],
  bossDeath:       [.55,,130,.05,.25,.6,4,2,-3,,50,.08,.15,3,,,,,.05],

  playerHit:       [.25,,280,,.02,.06,2,1.2,-10,,,-0.01,,,,,,.5],
  playerDeath:     [.45,,130,.03,.15,.4,4,2,-5,,,,.15,3,,,,,.1],

  promptInjection: [.35,,180,.03,.1,.25,2,1.5,6,,200,.07,.08,,,,,,.04],
  contextWarning:  [.15,,200,.02,.04,.08,2,,,-3,,,,,,,,.4],
  contextCollapse: [.25,,42,.05,.15,.3,2,1.5,-4,,,,,0.5,,,,,.1],

  tokenCollect:    [.18,,900,.01,.01,.04,,1,6,,,,,,,,,.7],
  healthPickup:    [.2,,800,.04,.08,.12,,1.5,4,,180,.05,,,,,,.5],

  waveComplete:    [.25,,500,.02,.06,.12,,1.5,,,300,.05,.08,,,,,,.03],
  layerComplete:   [.3,,440,.03,.12,.2,,1.5,,,350,.07,.1,,,,,,.02],
  bossIntro:       [.45,,70,.12,.3,.45,2,2.5,-1,,,,.2,2.5,,,,,.06],

  classSelect:     [.15,,600,.01,.03,.06,,1,4,,150,.04,,,,,,.6],
  uiNavigate:      [.08,,850,,.005,.01,,,,,,,,,,,,,.4],
  uiSelect:        [.12,,700,,.01,.02,,,,,,,,,,,,,.5],

  gameStart:       [.2,,420,.03,.1,.15,,1.5,,,200,.06,.08,,,,,,.02],
  gameOver:        [.3,,150,.05,.15,.4,2,2,-3,,,,.1,2,,,,,.08],
  victory:         [.3,,440,.03,.15,.25,,1.5,,,300,.08,.12,,,,,,.02],

  hallucinate:     [.12,,1200,.02,.03,.08,0,1.5,-10,,,,,,,,,.3],
  collapseCreep:   [.08,,60,.02,.08,.15,4,2,-1,,,,,1,,,,,.1],
  deathBoom:       [.5,,60,.04,.2,.5,4,2.5,-2,,30,.06,.15,2.5,,,,,.06],

  lowHpWarn:       [.12,,90,.02,.06,.12,2,1.8,-4,,,,,,,,,.15],
} as const;

type SfxName = keyof typeof SFX;

class AudioManager {
  private _muted = false;
  private _volume = 0.7;
  private _initialized = false;

  get muted() { return this._muted; }
  get volume() { return this._volume; }

  init() {
    if (this._initialized) return;
    this._initialized = true;
    try {
      if (ZZFX.audioContext.state === 'suspended') {
        ZZFX.audioContext.resume();
      }
    } catch { /* AudioContext may not be available */ }
  }

  play(name: SfxName) {
    if (this._muted || !this._initialized) return;
    const params = [...SFX[name]] as number[];
    params[0] = (params[0] || 0.3) * this._volume;
    try { zzfx(...params); } catch { /* silent fail */ }
  }

  setVolume(v: number) { this._volume = Math.max(0, Math.min(1, v)); }
  toggleMute(): boolean { this._muted = !this._muted; return this._muted; }
  setMuted(m: boolean) { this._muted = m; }
}

export const audio = new AudioManager();
