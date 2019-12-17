/* @flow */

function covers /*:: <T> */(big /*: {[string]: T} */, small /*: {[string]: T} */) /*: boolean */ {
  return Object.keys(small).every(key => Object.prototype.hasOwnProperty.call(big, key))
}

module.exports = {
  covers
}
