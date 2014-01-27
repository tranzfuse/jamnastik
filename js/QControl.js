/**
 * @constructor
 */
function QControl(id) {
  this.id = id;
  this.domEl = null;
  this.node = null;
  this.mult = 30;
}

/**
 * @method init setup the instance
 * @param node {object} instance of context.createQNode()
 * @return this
 */
QControl.prototype.init = function(node) {
  this.setDomEl();
  this._setNode(node);
  this._handleEvents();
  return this;
}

/**
 * @method set the QControl instance dom element reference
 * @return this
 */
QControl.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

/**
 * @method set node property
* @param node {object} instance of context.createQNode()
* @return this
*/
QControl.prototype._setNode = function(node) {
  this.node = node;
  return this;
}

// Again, stolen with pride from:
// http://www.html5rocks.com/en/tutorials/webaudio/intro/js/filter-sample.js
QControl.prototype.changeQ = function(element) {
  this.node.Q.value = element.value * this.mult;
}

/**
 * @method bind listeners to events
 * @private
 * @return undefined
 */
QControl.prototype._handleEvents = function() {
  var self = this;

  //input
  this.domEl.addEventListener('input', function(e) {
    self.changeQ(e.target);
  }, false);
}

module.exports = QControl;
