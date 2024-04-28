var Platform = require('sdk/base/util/Platform');

define(['dojo/_base/declare', 'dojo/_base/lang', 'sdk/modules/base/CoreModule', 'sdk/base/util/XhrProvider'], function (declare, lang, coreModule, XhrProvider) {
  /**
   * @namespace tdapi/modules/PlayerWebAdmin
   */
  var module = declare([coreModule], {
    constructor: function (config, target) {
      console.log('playerWebAdmin::constructor');

      this.platform = new Platform(config.platformId);

      this.inherited(arguments);
    },

    start: function () {
      console.log('playerWebAdmin::start');

      this.emit('module-ready', { id: 'PlayerWebAdmin', module: this });
    },

    /**
     * @param {string} mount
     * @param {number} streamid
     *
     * @desc
     * Load PWA data (JSON-P call)<br>
     * TODO: monitor this Bug in Dojo: http://bugs.dojotoolkit.org/ticket/16408<br>
     * Also, dojo/request/script error function is not working: http://bugs.dojotoolkit.org/ticket/16138
     */
    load: function (mount, streamid) {
      console.log('playerWebAdmin::load - mount=' + mount + ', streamid=' + streamid);

      var successCallback = lang.hitch(this, this._onLoadComplete);
      var errorCallback = lang.hitch(this, this._onLoadError);

      var xhrProv = new XhrProvider();
      var requestArgs = this._getRequestArgs(mount, streamid);
      xhrProv.request(
        this.platform.endpoint.playerWebAdmin,
        requestArgs.query,
        { handleAs: 'xml', preventCache: true, query: requestArgs.query, headers: { 'X-Requested-With': null, 'Content-Type': 'text/plain; charset=utf-8' } },
        function (query, data) {
          successCallback(mount, JSON.parse(data));
        },
        function (query, error) {
          errorCallback(mount, 'An unexpected error occurred: ' + error);
        }
      );
    },

    _onLoadError: function (mount, error) {
      console.error('playerWebAdmin::_onLoadError - mount=' + mount + ' - error=' + error);

      this.emit('pwa-data-error', { mount: mount, error: error });
    },

    _onLoadComplete: function (mount, data) {
      console.log('playerWebAdmin::_onLoadComplete - mount=' + mount);
      console.log('playerWebAdmin::pwa-data-loaded');
      console.log(data);

      this.emit('pwa-data-loaded', { mount: mount, config: data });
    },

    /**
     * Return the required parameters for the jsonp request.
     * http://dojotoolkit.org/documentation/tutorials/1.8/jsonp/
     * @ignore
     */
    _getRequestArgs: function (mount, streamid) {
      return {
        jsonp: 'callback',
        preventCache: true,
        query: {
          callsign: mount,
          streamid: streamid
        }
      };
    }
  });

  return module;
});
