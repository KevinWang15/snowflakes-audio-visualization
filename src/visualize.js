export default function (audio, canvas) {
  let context = new AudioContext();
  let src = context.createMediaElementSource(audio);
  let analyser = context.createAnalyser();

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let ctx = canvas.getContext("2d");

  src.connect(analyser);
  analyser.connect(context.destination);

  analyser.fftSize = 256;


  let bufferLength = analyser.frequencyBinCount;
  console.log(bufferLength);

  let dataArray = new Uint8Array(bufferLength);

  let WIDTH = canvas.width;
  let HEIGHT = canvas.height;

  let barWidth = (WIDTH / bufferLength) * 2.5;
  let barHeight;
  let x = 0;

  function renderFrame() {
    requestAnimationFrame(renderFrame);

    x = 0;

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = "#000";
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