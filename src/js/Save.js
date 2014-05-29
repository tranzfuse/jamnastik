/**
 * @constructor
 */
function Save(id, pubsub, filterControl, qControl, gainControl, tempo, stepSequencer) {

  /**
   * The save control html element's id
   */
  this.id = id;

  /**
   * The app pubsub instance
   */
  this.pubsub = pubsub;

  /**
   * The save control html element dom reference
   */
  this.domEl = document.getElementById(this.id);

  /**
   * The FilterControl instance
   */
  this.filterControl = filterControl;

  /**
   * The QControl instance
   */
  this.qControl = qControl;

  /**
   * The GainControl instance
   */
  this.gainControl = gainControl;

  /**
   * The Tempo instance
   */
  this.tempo = tempo;

  /**
   * The StepSequencer instance
   */
  this.stepSequencer = stepSequencer;
}

/**
 * Setup the Save instance
 * @return this
 */
Save.prototype.init = function() {
  this.saveBtn = this.domEl.querySelector('.btn-save');
  this.saveOK = this.domEl.querySelector('.glyphicon-ok');
  this._handleEvents();

  return this;
}

/**
 * Subscribe and bind listeners to events
 * @private
 */
Save.prototype._handleEvents = function() {
  var self = this;

  //click
  this.domEl.addEventListener('click', function(e) {
    self.save();
  });

  this.pubsub.on('save:ok', function(data) {
    self.onOK(data);
  });

  this.pubsub.on('save:error', function(data) {
    self.onError(data);
  });
}

/**
 * Save the current state of the app to localstorage
 * and emit an event on success/fail.
 * @TODO Create a save method for App.
 */
Save.prototype.save = function() {
  var xhr,
    self = this;

  var data = {
    q: this.qControl.domEl.value,
    filter: this.filterControl.domEl.value,
    filterEnabled: this.filterControl.isEnabled,
    gain: this.gainControl.domEl.value,
    tempo: this.tempo.getTempo(),
    stepSequencer: this.stepSequencer.getSequence()
  };

  xhr = new XMLHttpRequest();

  xhr.open('POST', '/save', true);

  xhr.setRequestHeader('Content-type','application/json; charset=utf-8');

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        console.log(xhr.responseText);
        self.pubsub.emit('save:ok', xhr.responseText);
      } else {
        self.pubsub.emit('save:error', {'error': xhr.statusText});
      }
    }
  }

  xhr.send(JSON.stringify(data));
}

/**
 * Handle successful save event
 * @param ajax success response
 */
Save.prototype.onOK = function(data) {
  this.saveOK.classList.remove('is-hidden');
  console.log('data from onOK', data);
}

/**
 * Handle failed save event
 * @param error {object}
 */
Save.prototype.onError = function(error) {
  //tell the user that save failed.
  console.log(error);
}

/**
 * Fired on a successful save
 *
 * @event
 * @name save:ok
 * @memberOf Save
 */

/**
 * Fired on a failed save attempt
 *
 * @event
 * @name save:error
 * @memberOf Save
 */

module.exports = Save;
