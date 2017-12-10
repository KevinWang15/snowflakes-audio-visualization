import { pitchDetect } from "./effects/pitch-detect";

export default function (audio, canvas, arrayBuffer) {
  let context = new AudioContext();
  let src = context.createMediaElementSource(audio);
  let analyser = context.createAnalyser();
  canvas.width = 1000;
  canvas.height = 800;
  let ctx = canvas.getContext("2d");

  context.decodeAudioData(arrayBuffer, function (buffer) {
    pitchDetect(context, analyser,ctx);
  });


  src.connect(analyser);
  analyser.connect(context.destination);
  analyser.fftSize = 256;
  let bufferLength = analyser.frequencyBinCount;

  let dataArray = new Uint8Array(bufferLength);

  let WIDTH = canvas.width;
  let HEIGHT = canvas.height;

  let barWidth = (WIDTH / bufferLength) * 2.5;
  let barHeight;
  let x = 0;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);


  function renderFrame() {
    requestAnimationFrame(renderFrame);

    x = 0;

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];

      ctx.strokeStyle = "#0000FF";
      ctx.strokeRect(x, HEIGHT - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  renderFrame();
};