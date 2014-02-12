var dom = require('./dom');
var utils = require('./utils');

/**
 * Borrowed the general concept and math from
 * https://github.com/martinaglv/KnobKnob/blob/master/knobKnob/knobKnob.jquery.js
 * @constructor
 */
function Knob(id, pubsub, rangeMax, eventName, initMax) {

  /**
   * dom element id
   */
  this.id = id;

  /**
   * The pubsub instance
   */
  this.pubsub = pubsub;

  /**
   * The html input range max value for the knob control
   * @member {number}
   */
  this.rangeMax = rangeMax || 1;

  /**
   * Dynamically named event emitted on mouse events
   * @member {string}
   */
  this.eventName = eventName;

  /**
   * dom element reference
   * @member {object}
   */
  this.domEl = null;

  /**
   * Save the starting position of the drag
   * @member {number}
   */
  this.startDeg = -1;

  /**
   * Keep track of the current degree the knob is turned to
   * @member {number}
   */
  this.currentDeg = 0;

  /**
   * Store the current degree the knob is turned to on mouseup
   * @member {number}
   */
  this.rotation = 0;

  /**
   * The last degree the knob was turned to
   * @member {number}
   */
  this.lastDeg = 0;

  /**
   * Maximum degree the knob should be turned
   * @member {number}
   */
  this.maxDeg = 270;

  /**
   * Should the knob be turned to the maxDeg on initialization
   * @member {boolean}
   */
  this.initMax = initMax;
}

Knob.prototype.init = function() {
  this.setDomEl();
  this._handleEvents();

  if (this.initMax) {
    this.rotation = this.lastDeg = this.currentDeg = this.maxDeg;
    this.turn(this.maxDeg);
  }
}

/**
 * Rotate the knob dom element
 * @return this
 */
Knob.prototype.turn = function(value) {
  this.domEl.style.webkitTransform = 'rotate(' + value + 'deg)';
  this.domEl.style.transform = 'rotate(' + value + 'deg)';
  return this;
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

    var a, b, deg, tmp;

    var rad2deg = 180 / Math.PI;

    var handleMousemove = function(e) {

      //e = (e.touches) ? e.touches[0] : e;

      a = center.y - e.pageY;
      b = center.x - e.pageX;
      deg = Math.atan2(a, b) * rad2deg;

      // we have to make sure that negative
      // angles are turned into positive:
      if (deg < 0) {
          deg = self.maxDeg + deg;
      }

      // Save the starting position of the drag
      if (self.startDeg === -1) {
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

      // This would suggest we are at an end position;
      // we need to block further rotation.
      if (Math.abs(tmp - self.lastDeg) > 180) {
          return false;
      }

      self.currentDeg = tmp;
      self.lastDeg = tmp;

      self.turn(self.currentDeg);

      self.pubsub.emit(self.eventName, {value: utils.normalize(self.rangeMax, self.maxDeg, self.currentDeg)});
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

/**
 * Fired when the knob is turning
 *
 * @event
 * @name {id}-knob:turn
 * @memberOf Knob
 */

module.exports = Knob;
