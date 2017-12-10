import { pitchDetect } from "./effects/pitch-detect";
import { frequencyDetect } from "./effects/frequency-detect";

export default function (audio, canvas, arrayBuffer) {
  let context = new AudioContext();
  let src = context.createMediaElementSource(audio);
  let analyser = context.createAnalyser();
  let analyser2 = context.createAnalyser();
  canvas.width = 1000;
  canvas.height = 800;
  let ctx = canvas.getContext("2d");
  src.connect(analyser);
  analyser.connect(context.destination);
  src.connect(analyser2);
  analyser2.connect(context.destination);

  context.decodeAudioData(arrayBuffer, function (buffer) {
    pitchDetect(context, analyser, ctx);
    frequencyDetect(context, analyser2, ctx);
  });
};