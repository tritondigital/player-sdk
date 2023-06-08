/**
 * @module Npe/Song
 *
 * @desc
 * Class instanciated by NPE module to wrap NPE metadata.<br>
 * Song object contains Track, Artist and objects instances<br>
 *
 */
define([
  "dojo/_base/declare",
  "sdk/modules/npe/Track",
  "sdk/modules/npe/Artist",
  "sdk/modules/npe/Album",
], function (declare, Track, Artist, Album) {
  var song = declare([], {
    constructor: function (data, npeId, platformId) {
      console.log("song::constructor");
      console.log(data);

      this.songData = data;
      this.npeId = npeId;
      this.platformId = platformId;

      this.trackInstance = null;
      this.albumInstance = null;
      this.artistInstance = null;

      this.inherited(arguments);
    },

    /**
     * Track of the song
     *
     * @return {Track} the track of the song
     */
    track: function () {
      if (this.songData.track == undefined) return null;

      if (this.trackInstance == null)
        this.trackInstance = new Track(this.songData.track, this.platformId);

      return this.trackInstance;
    },

    /**
     * Artist of the song
     *
     * @return {Artist} the artist of the song
     */
    artist: function () {
      if (this.songData.artists == undefined) return null;

      if (this.artistInstance == null)
        this.artistInstance = new Artist(
          this.songData.artists[0],
          this.platformId
        );

      return this.artistInstance;
    },

    /**
     * Album of the song
     *
     * @return {Album} the album of the song
     */
    album: function () {
      if (this.songData.album == undefined) return null;

      if (this.albumInstance == null)
        this.albumInstance = new Album(this.songData.album, this.platformId);

      return this.albumInstance;
    },
  });

  return song;
});
