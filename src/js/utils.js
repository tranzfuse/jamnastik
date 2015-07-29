/**
 * Normalize a given value from a larger range of numbers to a smaller
 * range of numbers.
 *
 * @param scaleMax {number} The largest number in the range being scaled to
 * @param rangeMax {number} The largest number in the range the value appeared in
 * @param value {number} The number to be scaled
 * @return {number}
 */
exports.normalize = function(scaleMax, rangeMax, value) {
  return scaleMax * (value / rangeMax);
}

//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
exports.uuid = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
}
