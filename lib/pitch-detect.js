// Retrieved and adjusted from https://github.com/cwilso/PitchDetect/blob/master/js/pitchdetect.js

/*
 The MIT License (MIT)
 Copyright (c) 2014 Chris Wilson
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = null;
var isPlaying = false;
var analyser = null;
var canvasElem,
  waveCanvas,
  pitchElem,
  noteElem,
  detuneElem,
  detuneAmount;

let MAX_SIZE;
let isLiveInput;
let callback = null;

window.onload = function () {
  audioContext = new AudioContext();
  MAX_SIZE = Math.max(4, Math.floor(audioContext.sampleRate / 5000));	// corresponds to a 5kHz signal

  canvasElem = document.createElement('canvas');
  pitchElem = document.createElement('div');
  noteElem = document.createElement('div');
  detuneElem = document.createElement('div');
  detuneAmount = document.createElement('div');
  document.body.appendChild(canvasElem);
  document.body.appendChild(pitchElem);
  document.body.appendChild(noteElem);
  document.body.appendChild(detuneElem);
  document.body.appendChild(detuneAmount);
};

function error() {
  alert('Stream generation failed.');
}

function getUserMedia(dictionary, callback) {
  try {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;
    navigator.getUserMedia(dictionary, callback, error);
  } catch (e) {
    alert('getUserMedia threw exception :' + e);
  }
}
export function pitchDetect(context, _analyser, _callback) {
  callback = _callback;
  analyser = _analyser;
  analyser.fftSize = 2048;
  analyser.connect(context.destination);
  isPlaying = true;
  isLiveInput = false;
  updatePitch();

  return "stop";
}

var rafID = null;
var buflen = 1024;
var buf = new Float32Array(buflen);

function noteFromPitch(frequency) {
  var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2) );
  return Math.round(noteNum) + 69;
}

function frequencyFromNoteNumber(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}


var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.
var GOOD_ENOUGH_CORRELATION = 0.9; // this is the "bar" for how close a correlation needs to be

function autoCorrelate(buf, sampleRate) {
  var SIZE = buf.length;
  var MAX_SAMPLES = Math.floor(SIZE / 2);
  var best_offset = -1;
  var best_correlation = 0;
  var rms = 0;
  var foundGoodCorrelation = false;
  var correlations = new Array(MAX_SAMPLES);

  for (var i = 0; i < SIZE; i++) {
    var val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) // not enough signal
    return -1;

  var lastCorrelation = 1;
  for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    var correlation = 0;

    for (var i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs((buf[i]) - (buf[i + offset]));
    }
    correlation = 1 - (correlation / MAX_SAMPLES);
    correlations[offset] = correlation; // store it, for the tweaking we need to do below.
    if ((correlation > GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
      foundGoodCorrelation = true;
      if (correlation > best_correlation) {
        best_correlation = correlation;
        best_offset = offset;
      }
    } else if (foundGoodCorrelation) {
      // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
      // Now we need to tweak the offset - by interpolating between the values to the left and right of the
      // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
      // we need to do a curve fit on correlations[] around best_offset in order to better determine precise
      // (anti-aliased) offset.

      // we know best_offset >=1,
      // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
      // we can't drop into this clause until the following pass (else if).
      var shift = (correlations[best_offset + 1] - correlations[best_offset - 1]) / correlations[best_offset];
      return sampleRate / (best_offset + (8 * shift));
    }
    lastCorrelation = correlation;
  }
  if (best_correlation > 0.01) {
    // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
    return sampleRate / best_offset;
  }
  return -1;
//	var best_frequency = sampleRate/best_offset;
}

function updatePitch(time) {
  analyser.getFloatTimeDomainData(buf);
  var ac = autoCorrelate(buf, audioContext.sampleRate);
  // TODO: Paint confidence meter on canvasElem here.

  if (ac == -1) {
    pitchElem.innerText = "--";
    noteElem.innerText = "-";
    detuneElem.className = "";
    detuneAmount.innerText = "--";
  } else {
    callback(ac);
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = window.webkitRequestAnimationFrame;
  rafID = window.requestAnimationFrame(updatePitch);
}