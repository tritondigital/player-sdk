/**
 * Track Stw CuePoint
 */
define([], function () {
  var trackCuePoint = {
    CUE_TITLE: 'cueTitle',
    ARTIST_NAME: 'artistName',
    ALBUM_NAME: 'albumName',
    PROGRAM_ID: 'trackID',
    CUE_TIME_DURATION: 'cueTimeDuration',
    CUE_TIME_START: 'cueTimeStart',
    TRACK_ID: 'trackID',
    NOW_PLAYING_URL: 'nowplayingURL',
    TRACK_COVER_URL: 'coverURL'
  };

  //TODO: add a constructor:
  /*var cuePoint = new TrackCuePoint(e.data.cuePoint);
     cuePoint.cueTitle();*/
  return trackCuePoint;
});
