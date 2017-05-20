// Generated by CoffeeScript 1.12.6
var clone;

clone = function(obj) {
  var flags, key, newInstance;
  if ((obj == null) || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (obj instanceof RegExp) {
    flags = '';
    if (obj.global) {
      flags += 'g';
    }
    if (obj.ignoreCase) {
      flags += 'i';
    }
    if (obj.multiline) {
      flags += 'm';
    }
    if (obj.sticky) {
      flags += 'y';
    }
    return new RegExp(obj.source, flags);
  }
  newInstance = new obj.constructor();
  for (key in obj) {
    newInstance[key] = clone(obj[key]);
  }
  return newInstance;
};

module.exports = {
  clone: clone
};
