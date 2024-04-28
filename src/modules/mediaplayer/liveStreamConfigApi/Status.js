function Status(data) {
  this.statusCode = null;
  this.message = null;
  this.isError = false;
  this.isGeoBlocked = false;

  parse(this, data);

  function parse(context, data) {
    // Code
    context.statusCode = data['status-code'] ? data['status-code']._text : -1;
    context.message = data['status-message'] ? data['status-message']._text : null;

    context.isError = context.statusCode >= 300 || context.statusCode === -1;
    context.isGeoBlocked = context.statusCode === 453;
  }
}

module.exports = Status;
