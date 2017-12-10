import { pitchDetect } from "../lib/pitch-detect";
const pitchesOffset = -300;
const timeWindowLength = 100;
const valuesInTimeWindow = [];
let pitches = [];

export default function (audio, canvas, arrayBuffer) {
  let context = new AudioContext();
  let src = context.createMediaElementSource(audio);
  let analyser = context.createAnalyser();

  context.decodeAudioData(arrayBuffer, function (buffer) {
    pitchDetect(context, analyser, (value) => {
      valuesInTimeWindow.push(value);
    });
    setInterval(() => {
      let average = 0;
      if (valuesInTimeWindow.length) {
        average = valuesInTimeWindow.reduce((p, c) => p + c, 0) / valuesInTimeWindow.length;
        valuesInTimeWindow.splice(0);
      }
      pitches.push(average);
      // 取最后100个元素
      pitches = pitches.slice(-100);
      console.log(pitches);
    }, timeWindowLength);
  });

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

    for (let i = 0; i < pitches.length; i++) {
      ctx.strokeStyle = "#FF0000";
      if (pitches[i] + pitchesOffset <= 0) continue;
      ctx.strokeRect(pitches[i] + pitchesOffset - 10, (pitches.length - i) * 10, 20, 10);
    }
  }

  renderFrame();
};