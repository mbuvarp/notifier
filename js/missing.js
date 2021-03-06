
// Small function library for Online Notifier

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isEmpty(v) {
  if (typeof v == 'undefined' || v == null) return true;
  if (typeof v == 'string' && v.trim() == '') return true;
  if (typeof v == 'number' && (isNaN(v) || v == 0)) return true;
  if (typeof v == 'boolean' && v == false) return true;
  return false;
}

function stacktrace() {
  var e = new Error('dummy');
  var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '').replace(/^\s+at\s+/gm, '').replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@').split('\n');
  stack = stack.slice(1);
  console.log(stack);
}

// Small prototype library for Online Notifier

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.startsWith = function (prefix) {
  return this.indexOf(prefix) == 0;
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
}
