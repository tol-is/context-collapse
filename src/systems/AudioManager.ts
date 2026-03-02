import { zzfx, ZZFX } from 'zzfx';

const SFX = {
  shoot:           [.15,,520,.008,.01,.03,0,0,-15,,,,,,,,,.7],
  shootSpread:     [.12,,340,.008,.015,.03,0,0,-8,,,,,,,,,.5],
  shootHeavy:      [.22,,240,.01,.03,.06,2,.8,-6,,,,,,,,,.7],
  shootRapid:      [.09,,480,.003,.005,.012,0,0,-12,,,,,,,,,.45],
  shootChain:      [.13,,600,.005,.015,.04,0,.4,-25,,180,.02,,,,,,,.5],
  shootNova:       [.18,,220,.015,.035,.08,2,.5,-10,,80,.03,,,,,,,.5],
  shootVortex:     [.1,,360,.005,.012,.03,0,.8,-6,,40,.01,,,,,,,.4],
  shootOrbital:    [.17,,160,.02,.04,.1,2,1,6,,-60,.04,,,,,,,.45],
  shootRailgun:    [.25,,130,.005,.035,.12,2,1.2,-20,,,,,,,,,.6],
  shootShockwave:  [.18,,170,.01,.05,.1,2,1,-5,,,,,,,,,.45],
  shootExplosive:  [.2,,190,.015,.04,.1,2,1.5,-8,,,,,,,,,.55],
  shootLaser:      [.08,,750,.002,.006,.01,0,0,-30,,,,,,,,,.4],
  shootHoming:     [.12,,440,.008,.015,.035,0,.2,-12,,100,.02,,,,,,,.5],
  shootPiercing:   [.15,,620,.005,.012,.03,0,0,-22,,,,,,,,,.6],

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
