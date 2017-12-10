export function frequencyDetect(context, analyser, ctx) {
  analyser.fftSize = 2048;
  let bufferLength = analyser.frequencyBinCount;
  let dataArray = new Uint8Array(bufferLength);
  let barWidth = (ctx.canvas.width / bufferLength) * 20;
  let barHeight;
  let x = 0;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);


  function renderFrame() {
    requestAnimationFrame(renderFrame);

    x = 0;
    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];
      ctx.strokeStyle = "#0000FF";
      ctx.strokeRect(x, ctx.canvas.height - barHeight, barWidth, barHeight);
      x += barWidth;
    }
  }
  renderFrame();
}
