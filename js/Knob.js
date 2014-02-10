var dom = require('./dom');

/**
 * Borrowed the general concept and math from
 * https://github.com/martinaglv/KnobKnob/blob/master/knobKnob/knobKnob.jquery.js
 * @constructor
 */
function Knob(id) {
  this.id = id;
  this.snap = 0;
  this.value = 0;
  this.domEl = null;
  this.startDeg = -1;
  this.currentDeg = 0;
  this.rotation = null;
  this.lastDeg = 0;
  this.maxDeg = 270;
}

Knob.prototype.init = function() {
  this.setDomEl();

  if (this.value > 0 && this.value <= (this.maxDeg - 1)) {
    this.rotation = this.lastDeg = this.currentDeg = this.value;
    this.rotate(this.currentDeg);
  }

  this._handleEvents();
}

Knob.prototype.rotate = function(value) {
  this.domEl.style.webkitTransform = 'rotate(' + value + 'deg)';
  this.domEl.style.transform = 'rotate(' + value + 'deg)';
}

/**
 * Set the Knob instance dom element reference
 * @return this
 */
Knob.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

//@TODO Add touch support
Knob.prototype._handleEvents = function() {
  var self = this;

  //mousedown, touchstart
  this.domEl.addEventListener('mousedown', function(e) {

    e.preventDefault();

    var offset = dom.getOffset(self.domEl);

    var center = {
      y: offset.top + dom.getHeight(self.domEl) / 2,
      x: offset.left + dom.getWidth(self.domEl) / 2
    };

    var a, b, deg, tmp,
      rad2deg = 180 / Math.PI;

    var handleMousemove = function(e) {

      e = (e.touches) ? e.touches[0] : e;

      a = center.y - e.pageY;
      b = center.x - e.pageX;
      deg = Math.atan2(a, b) * rad2deg;

      // we have to make sure that negative
      // angles are turned into positive:
      if (deg < 0) {
          deg = self.maxDeg + deg;
      }

      // Save the starting position of the drag
      if (self.startDeg == -1) {
          self.startDeg = deg;
      }

      // Calculating the current rotation
      tmp = Math.floor((deg - self.startDeg) + self.rotation);

      // Making sure the current rotation
      // stays between 0 and (this.maxDeg - 1)
      if (tmp < 0) {
          tmp = self.maxDeg + tmp;
      } else if (tmp > (self.maxDeg - 1)) {
          tmp = tmp % self.maxDeg;
      }

      // Snapping in the off position:
      if (self.snap && tmp < self.snap) {
          tmp = 0;
      }

      // This would suggest we are at an end position;
      // we need to block further rotation.
      if (Math.abs(tmp - self.lastDeg) > 180) {
          return false;
      }

      self.currentDeg = tmp;
      self.lastDeg = tmp;

      self.rotate(self.currentDeg);
    };

    var handleMouseup = function(e) {
      self.domEl.removeEventListener('mousemove', handleMousemove);
      document.removeEventListener('mouseup', handleMouseup);

      // Saving the current rotation
      self.rotation = self.currentDeg;

      // Marking the starting degree as invalid
      self.startDeg = -1;
    };

    //mousemove, touchmove
    self.domEl.addEventListener('mousemove', handleMousemove);

    //mouseup, touchend
    document.addEventListener('mouseup', handleMouseup);
  });
}

module.exports = Knob;
