var HTTPS_PROTOCOL = 'https:';

module.exports = {
  currentProtocolIsHttps: function currentProtocolIsHttps() {
    return window.location.protocol === HTTPS_PROTOCOL;
  },
  getProtocol: function () {
    return window.location.protocol;
  }
};
