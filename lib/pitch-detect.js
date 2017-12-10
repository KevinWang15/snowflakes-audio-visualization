// Adapted from https://github.com/cwilso/PitchDetect/blob/master/js/pitchdetect.js

let analyser = null;
let sampleRate = 0;
let callback = null;
let buflen = 1024;
let buf = new Float32Array(buflen);
let MIN_SAMPLES = 0;
let GOOD_ENOUGH_CORRELATION = 0.9;

export function pitchDetect(context, _analyser, _callback) {
  sampleRate = context.sampleRate;
  callback = _callback;
  analyser = _analyser;
  analyser.fftSize = 2048;
  analyser.connect(context.destination);
  updatePitch();
}

function autoCorrelate(buf, sampleRate) {
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
  for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;

    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs((buf[i]) - (buf[i + offset]));
    }
    correlation = 1 - (correlation / MAX_SAMPLES);
    correlations[offset] = correlation;
    if ((correlation > GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
      foundGoodCorrelation = true;
      if (correlation > best_correlation) {
        best_correlation = correlation;
        best_offset = offset;
      }
    } else if (foundGoodCorrelation) {
      let shift = (correlations[best_offset + 1] - correlations[best_offset - 1]) / correlations[best_offset];
      return sampleRate / (best_offset + (8 * shift));
    }
    lastCorrelation = correlation;
  }
  if (best_correlation > 0.01) {
    return sampleRate / best_offset;
  }
  return -1;
}

function updatePitch() {
  analyser.getFloatTimeDomainData(buf);
  callback(autoCorrelate(buf, sampleRate));
  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = window.webkitRequestAnimationFrame;
  window.requestAnimationFrame(updatePitch);
}