/**
 * @module Npe/Album
 *
 * @desc
 * NPE Album metadata<br>
 *
 */
define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/lang',
  'sdk/base/util/XhrProvider',
  'sdk/modules/npe/base/Inpe',
  'sdk/modules/npe/Track',
  'sdk/modules/npe/Picture',
  'dojo/on'
], function (declare, array, lang, XhrProvider, Inpe, Track, Picture, on) {
  var album = declare([Inpe], {
    constructor: function (data, platformId) {
      console.log('album::constructor');

      this.albumData = null;

      this.inherited(arguments);
    },

    getArtists: function () {
      return this.albumData.artists;
    },

    getArtistId: function () {
      return this.getArtists()[0].id;
    },

    getDuration: function () {
      return this.albumData.duration;
    },

    /**
     * Genres List of the Album
     *
     * @return {array} the genres list of the album
     */
    getGenres: function () {
      var genres = [];
      for (var i = 0; i < this.albumData.genres.length; i++) {
        genres.push(this.albumData.genres[i].name);
      }
      return genres;
    },

    /**
     * Title of the Album
     *
     * @return {string} the title of the album
     */
    getTitle: function () {
      if (this.albumData != null) return this.albumData.title;
      else return this.data.title;
    },

    /**
     * Label of the Album
     *
     * @return {string} the label of the album
     */
    getLabel: function () {
      return this.data.label;
    },

    /**
     * Release Date of the Album
     *
     * @return {string} the release date of the album
     */
    getReleaseDate: function () {
      if (this.albumData != null) return this.albumData.release;
      else return this.data.release;
    },

    getReview: function () {
      return this.albumData.review;
    },

    getReviewAuthor: function () {
      return this.albumData.reviewAuthor;
    },

    /**
     * URL for iTunes Buy Url
     *
     * @return {string} the url of iTunes JSON data
     */
    getBuyUrl: function () {
      if (this.albumData != null) return this.albumData.buyURL;
      else return this.data.buyURL;
    },

    /**
     * Rating
     *
     * @return {string} the rating
     */
    getRating: function () {
      if (this.albumData != null) return this.albumData.rating;
      else return this.data.rating;
    },

    /**
     * URL of the album original cover art
     *
     * @return {object} containing: {url, width, height, id}
     */
    getCoverArtOriginal: function () {
      var cover = this.albumData != null ? this.albumData.cover : this.data.cover;
      if (cover != null || cover != undefined) return { url: cover.originalSourceUrl, width: cover.width, height: cover.height, id: cover.id };
      else return null;
    },

    getCoverArtPicture: function () {
      return this.coverArtPicture;
    },

    /**
     * Fetch the array of covers variants
     *
     */
    fetchCoverArtPicture: function () {
      if (this.coverArtPicture) {
        this.notify('cover-complete', this.coverArtPicture);
        return;
      }

      var pictureItem = this.albumData != null ? this.albumData.cover : this.data.cover;

      if (pictureItem == null) {
        this.notify('cover-complete');
        return;
      }

      pictureItem.albumId = this.id;

      this.coverArtPicture = new Picture(pictureItem, this.platformId);

      if (this.coverArtPicture.successCallback) this.coverArtPicture.successCallback.remove();
      if (this.coverArtPicture.errorCallback) this.coverArtPicture.errorCallback.remove();

      this.coverArtPicture.successCallback = on(this.coverArtPicture, 'picture-complete', lang.hitch(this, this._onCoverArtPictureComplete));
      this.coverArtPicture.errorCallback = on(this.coverArtPicture, 'picture-error', lang.hitch(this, this._onCoverArtPictureComplete));

      this.coverArtPicture.fetchData();
    },

    //picture-complete = load complete or error
    _onCoverArtPictureComplete: function (requestData, data) {
      this.notify('cover-complete', this.coverArtPicture);
    },

    /**
     * List of tracks
     *
     * @return {Array} the list of tracks containing: {duration, id, staticURL, title, disc}
     */
    getTracks: function () {
      if (this.tracks == null) {
        this.tracks = [];

        var track;
        array.forEach(
          this.albumData.tracks,
          function (item, index) {
            track = new Track(item, this.platformId);
            this.tracks.push(track);
          },
          this
        );
      }

      return this.tracks;
    },

    getTrackById: function (trackId) {
      var itemIndex = -1;
      array.forEach(
        this.getTracks(),
        function (item, index) {
          if (item.id == trackId) itemIndex = index;
        },
        this
      );

      return itemIndex > -1 ? this.getTracks()[itemIndex] : null;
    },

    /**
     * Fetch data by requesting URL
     *
     */
    fetchData: function (isDynamicCall) {
      console.log('album::fetchData - id:' + this.id);

      isDynamicCall = isDynamicCall == undefined ? false : isDynamicCall;

      if (isDynamicCall) this.url = this.getDynamicAlbumUrl(this.id);

      if (this.url == null) {
        console.error('album::fetchData - The album url is undefined for album title=' + this.getTitle());

        this.notify('album-error', { albumId: this.id });
        return;
      }

      if (this.alreadyFetched == false) {
        var xhrProv = new XhrProvider();
        xhrProv.request(this.url, { albumId: this.id, isDynamicCall: isDynamicCall }, this.getRequestArgs(), lang.hitch(this, this._onLoadComplete), lang.hitch(this, this._onLoadError));
      } else {
        this.notify('album-complete', { albumId: this.id });
      }
    },

    /**
     * Fetch track data by id. Enhance the object this.tracks with the returned data for each track.
     *
     * @param trackIds {string or array} The list of tracks to retrieve data. Set a string for only one track, or an array for a list of tracks.
     */
    fetchTrackByIds: function (trackIds) {
      console.log('album::fetchTrackByIds - trackIds=' + trackIds);

      if (typeof trackIds == 'string') trackIds = [trackIds];

      this.tracksQueue = lang.clone(trackIds);

      var track;
      for (var i = 0; i < trackIds.length; i++) {
        track = this.getTrackById(trackIds[i]);

        if (track.successCallback) track.successCallback.remove();
        if (track.errorCallback) track.errorCallback.remove();

        track.successCallback = on(track, 'track-complete', lang.hitch(this, this._onTrackComplete));
        track.errorCallback = on(track, 'track-error', lang.hitch(this, this._onTrackComplete));

        track.fetchData();
      }
    },

    /***************************************/
    /******* PRIVATE FUNCTIONS  ************/
    /***************************************/

    _onLoadError: function (requestData, error) {
      console.error(error);

      if (requestData.isDynamicCall == false) {
        this.fetchData(true); //Fallback to dynamic url
      } else {
        this.notify('album-error', { albumId: requestData.albumId });
      }
    },

    _onLoadComplete: function (requestData, data) {
      console.log(data);

      this.albumData = data.album;

      this.alreadyFetched = true;

      this.notify('album-complete', { albumId: requestData.albumId });
    },

    //track completed = load complete or error
    _onTrackComplete: function (requestData, data) {
      console.log('_onTrackComplete - trackId=' + requestData.trackId);

      this._removeTrackFromQueue(requestData.trackId);

      if (this.tracksQueue.length == 0) {
        this.notify('track-complete', this.tracks);
      }
    },

    _removeTrackFromQueue: function (trackId) {
      //Remove the current track from this.tracksQueue
      var spliceStartIndex = -1;
      array.forEach(
        this.tracksQueue,
        function (itemId, index) {
          if (itemId == trackId) spliceStartIndex = index;
        },
        this
      );

      if (spliceStartIndex > -1) this.tracksQueue.splice(spliceStartIndex, 1);
    }
  });

  return album;
});
