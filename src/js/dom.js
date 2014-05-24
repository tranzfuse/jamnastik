exports.getOffset = function getOffset(elem) {
  var props = {},
    rect = elem.getBoundingClientRect();

  props.left = rect.left;
  props.top = rect.top;

  return props;
}

exports.getHeight = function getHeight(elem) {
  var rect = elem.getBoundingClientRect();
  return rect.height;
}

exports.getWidth = function getWidth(elem) {
  var rect = elem.getBoundingClientRect();
  return rect.width;
}
