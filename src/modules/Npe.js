var Platform = require('sdk/base/util/Platform');

define(['dojo/_base/declare', 'dojo/_base/Deferred', 'dojo/_base/lang', 'sdk/base/util/XhrProvider', 'sdk/modules/base/CoreModule', 'sdk/modules/npe/Song'], function (
  declare,
  Deferred,
  lang,
  XhrProvider,
  coreModule,
  Song
) {
  /**
   * @namespace tdapi/modules/npe
   */
  var npe = declare([coreModule], {
    constructor: function (config, target) {
      console.log('npe::constructor');

      this.platform = new Platform(config.platformId);

      this.library = [];

      this.inherited(arguments);
    },

    start: function () {
      console.log('npe::start');

      this.emit('module-ready', { id: 'Npe', module: this });
    },

    /**
     * Lazily load an NPE JSON
     *
     * @param npUrl
     * @param artist
     * @param title
     */
    loadNpeMetadata: function (npUrl, artist, title) {
      console.log('npe::loadNpeMetadata - npUrl=' + npUrl + ', artist=' + artist + ', title=' + title);

      var npeId = this._urlToNPEId(npUrl);
      var song = this.getSongByNpeId(npeId);

      if (song != null) {
        this.emit('npe-song', { song: song });

        var deferred = new Deferred();
        deferred.resolve({ song: song });
        return deferred;
      } else {
        return this._fetchData(false, npeId, npUrl, artist, title, new Deferred());
      }
    },

    /**
     * Return a Song by npeId
     *
     * @param npeId
     * @return {Song}
     */
    getSongByNpeId: function (npeId) {
      var libraryLength = this.library.length;

      //TODO: replace by array.some
      for (var i = 0; i < libraryLength; i++) {
        if (this.library[i].npeId == npeId) return this.library[i];
      }
      return null;
    },

    /***************************************/
    /******* PRIVATE FUNCTIONS  ************/
    /***************************************/

    /**
     * Npe Api dynamic url
     * Exposed for external usage.
     *
     * @returns {*|string|string|string}
     */
    getDynamicUrl: function () {
      return this.platform.endpoint.npe;
    },

    /**
     * Npe Api dynamic url to retrieve the song data when static url from track cuepoint return a 404 error.
     *
     * @param artist
     * @param title
     * @returns {string}
     */
    _getDynamicSongUrl: function (artist, title) {
      return this.getDynamicUrl() + 'song?artist=' + encodeURIComponent(artist) + '&title=' + encodeURIComponent(title);
    },

    _fetchData: function (isDynamicCall, npeId, npUrl, artist, title, deferred) {
      if (isDynamicCall) npUrl = this._getDynamicSongUrl(artist, title);

      var xhrProv = new XhrProvider();
      xhrProv.request(
        npUrl,
        {
          npeId: npeId,
          npUrl: npUrl,
          isDynamicCall: isDynamicCall,
          artist: artist,
          title: title,
          deferred: deferred
        },
        this._getRequestArgs(),
        lang.hitch(this, this._onLoadComplete),
        lang.hitch(this, this._onLoadError)
      );

      return deferred;
    },

    _onLoadError: function (requestData, error) {
      console.error('npe::_onLoadError - npUrl=' + requestData.npUrl + ' - error=' + error);

      if (requestData.isDynamicCall == false) {
        this._fetchData(true, requestData.npeId, null, requestData.artist, requestData.title, requestData.deferred); //Fallback to dynamic url
      } else {
        this.emit('npe-song-error', {
          npeId: this._urlToNPEId(requestData.npUrl)
        });

        return requestData.deferred.reject({
          npeId: this._urlToNPEId(requestData.npUrl)
        });
      }
    },

    _onLoadComplete: function (requestData, data) {
      console.log('npe::_onLoadComplete - npUrl=' + requestData.npUrl);
      console.log(data);

      var song = new Song(data.song, this._urlToNPEId(requestData.npUrl), this.config.platformId);

      this.library.push(song);

      this.emit('npe-song', { song: song });

      return requestData.deferred.resolve({ song: song });
    },

    /**
     * Return the required parameters for the xhr request.
     * @ignore
     */
    _getRequestArgs: function () {
      return {
        handleAs: 'json',
        preventCache: false,
        headers: {
          'X-Requested-With': null,
          'Content-Type': 'text/plain; charset=utf-8'
        }
      };
    },

    /**
     * Generate a unique npeId
     *
     * @param npUrl
     * @return {string}
     * @private
     */
    _urlToNPEId: function (npUrl) {
      if (npUrl == null || npUrl == undefined || npUrl == '') return null;

      var idx = npUrl.lastIndexOf('/');
      return npUrl.substr(idx - 2, 2) + npUrl.substring(idx + 1, npUrl.lastIndexOf('.'));
    }
  });

  return npe;
});
