declare module 'zzfx' {
  export function zzfx(...parameters: (number | undefined)[]): AudioBufferSourceNode;
  export const ZZFX: {
    volume: number;
    sampleRate: number;
    audioContext: AudioContext;
    play(...parameters: (number | undefined)[]): AudioBufferSourceNode;
    playSamples(sampleChannels: Float32Array[], volumeScale?: number, rate?: number, pan?: number, loop?: boolean): AudioBufferSourceNode;
    buildSamples(...parameters: (number | undefined)[]): Float32Array;
  };
}
