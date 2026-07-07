/** Decode an audio file to a compact set of waveform peaks + duration. */
export async function analyzeAudio(
  file: File,
  peakCount = 200,
): Promise<{ peaks: number[]; duration: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx =
    (window.AudioContext as typeof AudioContext) ||
    ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new AudioCtx();
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const channel = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channel.length / peakCount));
    const peaks: number[] = [];
    for (let i = 0; i < peakCount; i++) {
      let sum = 0;
      const start = i * blockSize;
      const end = Math.min(channel.length, start + blockSize);
      for (let j = start; j < end; j++) sum += Math.abs(channel[j]);
      peaks.push(sum / (end - start));
    }
    const max = Math.max(...peaks, 0.0001);
    return { peaks: peaks.map((p) => +(p / max).toFixed(4)), duration: audioBuffer.duration };
  } finally {
    void ctx.close();
  }
}
