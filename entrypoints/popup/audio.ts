export async function blobToPCM(blob: Blob, targetRate = 16_000) {
  const ctx = new AudioContext();

  const buf = await ctx.decodeAudioData(await blob.arrayBuffer());

  if (buf.sampleRate !== targetRate) {
    const off = new OfflineAudioContext(
      1,
      buf.duration * targetRate,
      targetRate
    );

    const src = off.createBufferSource();
    src.buffer = buf;
    src.connect(off.destination);
    src.start();

    const rendered = await off.startRendering();

    return rendered.getChannelData(0);
  }

  return buf.getChannelData(0);
}
