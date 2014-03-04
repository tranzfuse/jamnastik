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
