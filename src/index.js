import "./index.css";
import visualize from "./visualize";
let file = document.createElement('input');
file.type = 'file';
let audio = document.createElement("audio");
audio.controls = true;
let canvas = document.createElement('canvas');
document.body.appendChild(canvas);
document.body.appendChild(file);
document.body.appendChild(audio);

file.onchange = function () {
  let files = this.files;
  audio.src = URL.createObjectURL(files[0]);
  audio.load();
  audio.play();

  visualize(audio, canvas);
};
