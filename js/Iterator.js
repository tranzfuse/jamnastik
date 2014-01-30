function Iterator(data) {
  this.data = data || [];
  this.index = null;
  this.length = null;
}

Iterator.prototype.init = function(data) {
  this.data = data;
  this.index = 0;
  this.length = this.data.length;
}

Iterator.prototype.previous = function() {
  if (this.hasPrevious()) {
    this.index = this.index - 1;
    return this.current();
  }
  return false;
}

Iterator.prototype.next = function() {
  if (this.hasNext()) {
    this.index = this.index + 1;
    return this.current();
  }
  return false;
}

Iterator.prototype.hasNext = function() {
  return this.index < this.length;
}

Iterator.prototype.hasPrevious = function() {
  return this.index > 0;
}

Iterator.prototype.rewind = function() {
  this.index = 0;
}

Iterator.prototype.current = function() {
  return this.data[this.index];
}

Iterator.prototype.getPrevious = function() {
  if (this.hasPrevious()) {
    return this.data[this.index - 1];
  }
}

Iterator.prototype.getNext = function() {
  if (this.hasNext()) {
    return this.data[this.index + 1];
  }
}

Iterator.prototype.getByIndex = function(index) {
  return this.data[index];
}

module.exports = Iterator;
