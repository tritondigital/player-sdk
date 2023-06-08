// define( [
//     'dojo/_base/declare',
//     'dojo/_base/lang',
//     'sdk/modules/mediaplayer/liveapi/Connection'
// ], function ( declare, lang, Connection ) {
var _ = require("lodash");

function ConnectionIterator(streamingConnections) {
  this.streamingConnections = streamingConnections;
  this.totalIteration = 1;
  this.first = false;
  this.last = false;
  this.streamingConnectionIndex = 0;

  if (_.isEmpty(this.streamingConnections)) {
    throw new Error(
      "ConnectionIterator::constructor At least one connection is needed."
    );
  }
  /**
   * Reset the iterator
   */
  this.reset = function () {
    this.streamingConnectionIndex = 0;
  };

  /**
   * Get the current connection
   *
   * @returns {Connection}
   */
  this.current = function () {
    return this.streamingConnections[this.streamingConnectionIndex];
  };

  /**
   * Advance the pointer and return the next connection.
   *
   * @returns {Connection}
   */
  this.next = function () {
    this.first = false;
    this.streamingConnectionIndex++;
    this.last =
      _.last(this.streamingConnections) ===
      this.streamingConnections[this.streamingConnectionIndex];

    return this.current();
  };

  /**
   * Looped
   *
   * @returns {boolean}
   */
  this.hasLooped = function () {
    return this.last;
  };

  /**
   * Mount has Changed
   */
  this.isLastConnectionByMount = function () {
    var groupByMount = _.groupBy(this.streamingConnections, "mount");
    var totalLoop = groupByMount[this.current().mount].length;
    if (this.totalIteration === totalLoop) {
      this.totalIteration = 1;
      return true;
    } else {
      this.totalIteration++;
    }

    return false;
  };

  this.reset();
}

module.exports = ConnectionIterator;
