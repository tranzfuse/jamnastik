function ControlPanel(id, titleId, pubsub) {
  this.id = id;
  this.domEl = null;
  this.titleId = titleId;
  this.titleDomEl = null;
  this.isOpen = true;
  this.isClosed = false;
  this.openClass = 'open';
  this.closedClass = 'closed';
}

ControlPanel.prototype.init = function() {
  this.setDomEl();
  this.setTitleDomEl();
  this._handleEvents();
}

/**
 * set the ControlPanel instance dom element reference
 * @return this
 */
ControlPanel.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

ControlPanel.prototype.setTitleDomEl = function() {
  this.titleDomEl = document.getElementById(this.titleId);
  return this;
}

ControlPanel.prototype._handleEvents = function() {
  var self = this;


  // click
  this.titleDomEl.addEventListener('click', function(e) {

    if (self.isClosed) {
      self.open();
    } else {
      self.close();
    }

  }, false);

  this._handleResize();
}

ControlPanel.prototype._handleResize = function() {
  var mql = window.matchMedia('(min-width: 70em)');
  mql.addListener(this._handleMql.bind(this));
  this._handleMql(mql);
}

ControlPanel.prototype._handleMql = function(mql) {
  if (mql.matches) {
    //viewport is wider than 70em
    this.open();
  } else {
    // viewport is less than 70em
    this.close();
  }
}

ControlPanel.prototype.open = function() {
  this.isOpen = true;
  this.isClosed = false;
  this.domEl.classList.remove(this.closedClass);
  this.domEl.classList.add(this.openClass);
}

ControlPanel.prototype.close = function() {
  this.isOpen = false;
  this.isClosed = true;
  this.domEl.classList.add(this.closedClass);
  this.domEl.classList.remove(this.openClass);
}

module.exports = ControlPanel;
