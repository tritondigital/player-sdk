/**
 *
 */
function AlternateContent(data) {
  this.url = null;
  this.mount = null;

  parse(this, data);
  /**
   * Parse XML data
   *
   * @param {Element} data
   * @private
   */
  function parse(context, data) {
    // url
    context.url = data.url ? data.url._text : null;
    // mount
    context.mount = data.mount ? data.mount._text : null;
  }
}

module.exports = AlternateContent;
