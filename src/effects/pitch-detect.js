// Adapted from https://github.com/cwilso/PitchDetect/blob/master/js/pitchdetect.js

const config = {
  verticalBlocksCount: 100,
  timeWindowLength: 80,
  pitchesOffset: 20,
  goodEnoughCorrelation: 0.9,
  fftSize: 2048,
};
const valuesInTimeWindow = [];
let pastPitchesData = [];
let permanentSnow = [];
let analyser = null;
let buf = new Float32Array(1024);
let audioContext;
let canvasContext;
for (let i = 0; i < 1000; i++)
  permanentSnow[i] = 0;
export function pitchDetect(_audioContext, _analyser, _canvasContext) {
  audioContext = _audioContext;
  analyser = _analyser;
  canvasContext = _canvasContext;
  analyser.fftSize = config.fftSize;
  analyser.connect(audioContext.destination);
  renderFrame();
  setInterval(() => {
    let average = 0;
    if (valuesInTimeWindow.length) {
      average = valuesInTimeWindow.reduce((p, c) => p + c, 0) / valuesInTimeWindow.length;
      valuesInTimeWindow.splice(0);
    }
    pastPitchesData.push(average);
    // 取最后N个元素
    pastPitchesData = pastPitchesData.slice(-config.verticalBlocksCount);
  }, config.timeWindowLength);
}

function autoCorrelate(buf) {
  let SIZE = buf.length;
  let MAX_SAMPLES = Math.floor(SIZE / 2);
  let best_offset = -1;
  let best_correlation = 0;
  let rms = 0;
  let foundGoodCorrelation = false;
  let correlations = new Array(MAX_SAMPLES);

  for (let i = 0; i < SIZE; i++) {
    let val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01)
    return -1;

  let lastCorrelation = 1;
  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;

    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs((buf[i]) - (buf[i + offset]));
    }
    correlation = 1 - (correlation / MAX_SAMPLES);
    correlations[offset] = correlation;
    if ((correlation > config.goodEnoughCorrelation) && (correlation > lastCorrelation)) {
      foundGoodCorrelation = true;
      if (correlation > best_correlation) {
        best_correlation = correlation;
        best_offset = offset;
      }
    } else if (foundGoodCorrelation) {
      let shift = (correlations[best_offset + 1] - correlations[best_offset - 1]) / correlations[best_offset];
      return audioContext.sampleRate / (best_offset + (8 * shift));
    }
    lastCorrelation = correlation;
  }
  if (best_correlation > 0.01) {
    return audioContext.sampleRate / best_offset;
  }
  return -1;
}

function renderFrame() {
  analyser.getFloatTimeDomainData(buf);
  valuesInTimeWindow.push(autoCorrelate(buf));
  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = window.webkitRequestAnimationFrame;
  window.requestAnimationFrame(renderFrame);
  canvasContext.strokeStyle = "white";
  for (let i = 0; i < pastPitchesData.length; i++) {
    if (pastPitchesData[i] <= 0) continue;
    canvasContext.beginPath();
    canvasContext.arc(Math.round(pastPitchesData[i] * 0.8) + config.pitchesOffset, (pastPitchesData.length - i) * 8, 1, 0, 2 * Math.PI, false);
    if (i === 0 && pastPitchesData.length === config.verticalBlocksCount) {
      let pos = Math.round(pastPitchesData[i] * 0.8 + config.pitchesOffset);
      for (let j = 1; j <= 30; j++) {
        let heightAddition = Math.sin(Math.PI / 2 * (1 - (j / 30))) * 3;
        permanentSnow[pos - j] += heightAddition;
        permanentSnow[pos + j] += heightAddition;
      }
      permanentSnow[pos] += 3;
    }
    canvasContext.stroke();
  }
  canvasContext.fillStyle = "#FFFFFF90";
  for (let i = 0; i < 1000; i++) {
    let snowPileHeight = Math.pow(permanentSnow[i], 0.5) * 3;
    canvasContext.fillRect(i, 800 - snowPileHeight, 1, snowPileHeight);
    permanentSnow[i] *= 0.99;
  }
}