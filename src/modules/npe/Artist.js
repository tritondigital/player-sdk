/**
 * @module Npe/Artist
 *
 * @desc
 * NPE Artist metadata<br>
 *
 */
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "sdk/base/util/XhrProvider",
  "sdk/modules/npe/base/Inpe",
  "dojo/_base/array",
  "sdk/modules/npe/Album",
  "sdk/modules/npe/Picture",
  "dojo/on",
], function (declare, lang, XhrProvider, Inpe, array, Album, Picture, on) {
  var artist = declare([Inpe], {
    constructor: function (data, platformId) {
      console.log("artist::constructor");

      this.artistData = null;

      this.inherited(arguments);
    },

    /**
     * Name of the Artist
     *
     * @return {string} the name of the artist
     */
    getName: function () {
      if (this.artistData != null) return this.artistData.name;
      else return this.data.name;
    },

    /**
     * Biography of the Artist
     *
     * @return {string} the biography of the artist
     */
    getBiography: function () {
      return this.artistData.biography;
    },

    /**
     * Birth date of the Artist
     *
     * @return {string} the birth date of the artist
     */
    getBirthDate: function () {
      return this.artistData.beginDate;
    },

    /**
     * End date of the Artist
     *
     * @return {string} the end date of the artist
     */
    getEndDate: function () {
      return this.artistData.endDate;
    },

    /**
     * Begin place of the Artist
     *
     * @return {string} the begin place of the artist, example: Bay City, MI
     */
    getBeginPlace: function () {
      return this.artistData.beginPlace;
    },

    /**
     * End place of the Artist
     *
     * @return {string} the end date of the artist
     */
    getEndPlace: function () {
      return this.artistData.endPlace;
    },

    /**
     * Is it a group ?
     *
     * @return {boolean} true if it's a group
     */
    getIsGroup: function () {
      return this.artistData.isGroup;
    },

    /**
     * Country of the Artist
     *
     * @return {string} the country of the artist
     */
    getCountry: function () {
      return this.artistData.country;
    },

    /**
     * Genres List of the Artist
     *
     * @return {array} the genres list of the artist
     */
    getGenres: function () {
      var genres = [];
      for (var i = 0; i < this.artistData.genres.length; i++) {
        genres.push(this.artistData.genres[i].name);
      }
      return genres;
    },

    /**
     * Similar Artists list of the Artist
     *
     * @return {array} the similar artists list of the artist containing: {id, staticURL, name}
     */
    getSimilar: function () {
      return this.artistData.similars;
    },

    /**
     * Members List of the Group
     *
     * @return {array} the members list of the group
     */
    getMembers: function () {
      return this.artistData.members;
    },

    /**
     * Website URL of the Artist
     *
     * @return {string} the website URL of the artist
     */
    getWebsite: function () {
      return this.artistData.website;
    },

    /**
     * Twitter username of the Artist
     *
     * @return {string} the Twitter username of the artist
     */
    getTwitterUsername: function () {
      return this.artistData.twitter;
    },

    /**
     * Facebook page URL of the Artist
     *
     * @return {string} the Facebook page URL of the artist
     */
    getFacebookUrl: function () {
      return this.artistData.facebook;
    },

    /**
     * Albums of the Artist
     * By default, each album object it not populated with all the detailed album data (tracks, review, review, etc): Call the function fetchAlbumByIds() to retrieve all the detailed album data.
     *
     * @return {array} the albums of the artist containing: {id, staticURL, title, label, release, rating}
     */
    getAlbums: function () {
      if (this.albums == null) {
        this.albums = [];

        var album;
        array.forEach(
          this.artistData.albums,
          function (item, index) {
            album = new Album(item, this.platformId);
            this.albums.push(album);
          },
          this
        );
      }

      return this.albums;
    },

    getAlbumById: function (albumId) {
      var itemIndex = -1;
      array.forEach(
        this.getAlbums(),
        function (item, index) {
          if (item.id == albumId) itemIndex = index;
        },
        this
      );

      return itemIndex > -1 ? this.getAlbums()[itemIndex] : null;
    },

    /**
     * Pictures of the Artist
     *
     * @return {array} the pictures of the artist containing: {id, staticURL, originalSourceUrl, width, height}
     */
    getPictures: function () {
      if (this.pictures == null) {
        this.pictures = [];

        var picture;
        array.forEach(
          this.artistData.pictures,
          function (item, index) {
            item.artistId = this.id;
            picture = new Picture(item, this.platformId);
            this.pictures.push(picture);
          },
          this
        );
      }

      return this.pictures;
    },

    getPictureById: function (pictureId) {
      var itemIndex = -1;
      array.forEach(
        this.getPictures(),
        function (item, index) {
          if (item.id == pictureId) itemIndex = index;
        },
        this
      );

      return itemIndex > -1 ? this.getPictures()[itemIndex] : null;
    },

    /**
     * Fetch data by requesting URL
     *
     */
    fetchData: function (isDynamicCall) {
      isDynamicCall = isDynamicCall == undefined ? false : isDynamicCall;

      if (isDynamicCall) this.url = this.getDynamicArtistUrl(this.id);

      if (this.alreadyFetched == false) {
        var xhrProv = new XhrProvider();
        xhrProv.request(
          this.url,
          { isDynamicCall: isDynamicCall },
          this.getRequestArgs(),
          lang.hitch(this, this._onLoadComplete),
          lang.hitch(this, this._onLoadError)
        );
      } else {
        this.notify("artist-complete", { artistId: this.id });
      }
    },

    /**
     * Fetch album data by id. Enhance the object this.albums with the returned data for each album.
     *
     * @param albumIds {string or array} The list of albums to retrieve data. Set a string for only one album, or an array for a list of albums.
     */
    fetchAlbumByIds: function (albumIds) {
      console.log("artist::fetchAlbumByIds - albumIds=" + albumIds);

      if (typeof albumIds == "string") albumIds = [albumIds];

      this.albumsQueue = lang.clone(albumIds);

      var album;
      for (var i = 0; i < albumIds.length; i++) {
        album = this.getAlbumById(albumIds[i]);

        if (album.successCallback) album.successCallback.remove();
        if (album.errorCallback) album.errorCallback.remove();

        album.successCallback = on(
          album,
          "album-complete",
          lang.hitch(this, this._onAlbumComplete)
        );
        album.errorCallback = on(
          album,
          "album-error",
          lang.hitch(this, this._onAlbumComplete)
        );

        album.fetchData();
      }
    },

    /**
     * Fetch picture data by id. Enhance the object this.pictures with the returned data for each picture.
     *
     * @param pictureIds {string or array} The list of pictures to retrieve data. Set a string for only one picture, or an array for a list of pictures.
     */
    fetchPictureByIds: function (pictureIds) {
      console.log("artist::fetchPictureByIds - pictureIds=" + pictureIds);

      if (typeof pictureIds == "string") pictureIds = [pictureIds];

      this.picturesQueue = lang.clone(pictureIds);

      var picture;
      for (var i = 0; i < pictureIds.length; i++) {
        picture = this.getPictureById(pictureIds[i]);

        if (picture.successCallback) picture.successCallback.remove();
        if (picture.errorCallback) picture.errorCallback.remove();

        picture.successCallback = on(
          picture,
          "picture-complete",
          lang.hitch(this, this._onPictureComplete)
        );
        picture.errorCallback = on(
          picture,
          "picture-error",
          lang.hitch(this, this._onPictureComplete)
        );

        picture.fetchData();
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
        this.notify("artist-error", { artistId: this.id });
      }
    },

    _onLoadComplete: function (requestData, data) {
      this.artistData = data.artist;

      this.alreadyFetched = true;

      this.notify("artist-complete", { artistId: this.id });
    },

    //album completed = load complete or error
    _onAlbumComplete: function (requestData, data) {
      console.log("_onAlbumComplete - albumId=" + requestData.albumId);

      this._removeAlbumFromQueue(requestData.albumId);

      if (this.albumsQueue.length == 0) {
        this.notify("album-complete", this.albums);
      }
    },

    _removeAlbumFromQueue: function (albumId) {
      //Remove the current album from this.albumsQueue
      var spliceStartIndex = -1;
      array.forEach(
        this.albumsQueue,
        function (itemId, index) {
          if (itemId == albumId) spliceStartIndex = index;
        },
        this
      );

      if (spliceStartIndex > -1) this.albumsQueue.splice(spliceStartIndex, 1);
    },

    //picture completed = load complete or error
    _onPictureComplete: function (requestData, data) {
      console.log("_onPictureComplete - pictureId=" + requestData.pictureId);

      this._removePictureFromQueue(requestData.pictureId);

      if (this.picturesQueue.length == 0) {
        this.notify("picture-complete", this.pictures);
      }
    },

    _removePictureFromQueue: function (pictureId) {
      //Remove the current picture from this.picturesQueue
      var spliceStartIndex = -1;
      array.forEach(
        this.picturesQueue,
        function (itemId, index) {
          if (itemId == pictureId) spliceStartIndex = index;
        },
        this
      );

      if (spliceStartIndex > -1) this.picturesQueue.splice(spliceStartIndex, 1);
    },
  });

  return artist;
});
