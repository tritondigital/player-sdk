var Platform = require('sdk/base/util/Platform');

/**
 * NPE Object base class
 */
/**
 * @module npe/base/Inpe
 *
 * @desc
 * The Inpe is the base class of all NPE class in the api.
 */

define(['dojo/_base/declare', 'dojo/_base/lang', 'dojo/_base/array', 'dojo/on', 'dojo/Evented'], function (declare, lang, array, on, Evented) {
  var Inpe = declare([Evented], {
    constructor: function (data, platformId) {
      this.data = data;
      this.platformId = platformId;

      this.url = data.staticURL;
      this.id = data.id;

      this.listeners = [];

      this.platform = new Platform(platformId);

      this.alreadyFetched = false;
    },

    getStaticUrl: function () {
      return this.data.staticURL;
    },

    /**
     * Get api dynamic url (sed as a fallback for static url returning a 404 error)
     *
     * @ignore
     */
    getDynamicUrl: function () {
      return this.platform.endpoint.npe;
    },

    getDynamicArtistUrl: function (id) {
      return this.getDynamicUrl() + 'artist/' + id;
    },

    getDynamicAlbumUrl: function (id) {
      return this.getDynamicUrl() + 'album/' + id;
    },

    getDynamicTrackUrl: function (id) {
      return this.getDynamicUrl() + 'track/' + id;
    },

    getDynamicArtistPictureUrl: function (artistId, pictureId) {
      return this.getDynamicUrl() + 'artist/' + artistId + '/picture/' + pictureId;
    },

    getDynamicAlbumPictureUrl: function (albumId, pictureId) {
      return this.getDynamicUrl() + 'album/' + albumId + '/picture/' + pictureId;
    },

    notify: function (type, event) {
      console.log('Inpe::notify - type:' + type);

      this.emit(type, event);
    },

    /**
     * Return the required parameters for the xhr request.
     * @ignore
     */
    getRequestArgs: function () {
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
     * Add an event listener on the api
     * @param {string} eventName The event name
     * @param {function} callback The callback function
     */
    addEventListener: function (eventName, callback) {
      //Check if the listener exist before adding it
      var itemIndex = -1;
      //TODO: replace by array.some
      array.forEach(
        this.listeners,
        function (item, index) {
          if (item.eventName == eventName && item.callback == callback) itemIndex = index;
        },
        this
      );

      if (itemIndex == -1)
        this.listeners.push({
          eventName: eventName,
          callback: callback,
          listener: on(this, eventName, lang.hitch(this, callback))
        });
    },

    /**
     * Remove an event listener on the api
     * @param {string} eventName The event name
     * @param {function} callback The callback function
     */
    removeEventListener: function (eventName, callback) {
      var itemIndex = -1;
      //TODO: replace by array.some
      array.forEach(
        this.listeners,
        function (item, index) {
          if (item.eventName == eventName && item.callback == callback) itemIndex = index;
        },
        this
      );

      if (itemIndex > -1) {
        this.listeners[itemIndex].listener.remove();
        this.listeners.splice(itemIndex, 1);
      }
    }
  });

  return Inpe;
});
