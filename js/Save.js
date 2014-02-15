function Save(id, filterControl, qControl, gainControl, tempo, stepSequencer) {
  this.id = id;
  this.domEl = document.getElementById(this.id);
  this.filterControl = filterControl;
  this.qControl = qControl;
  this.gainControl = gainControl;
  this.tempo = tempo;
  this.stepSequencer = stepSequencer;
}

Save.prototype.init = function() {
  this._handleEvents();
}

Save.prototype._handleEvents = function() {
  var self = this;

  //click
  this.domEl.addEventListener('click', function(e) {
    self.save();
  });
}

Save.prototype.save = function() {
  var data = {
    q: this.qControl.domEl.value,
    filter: this.filterControl.domEl.value,
    filterEnabled: this.filterControl.isEnabled,
    gain: this.gainControl.domEl.value,
    tempo: this.tempo.getTempo(),
    stepSequencer: this.stepSequencer.grid
  };

  window.localStorage.setItem("sequencer:save", JSON.stringify(data));
  console.log(data);
}

module.exports = Save;
