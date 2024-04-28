/**
 * @module TargetSpot
 *
 * @desc
 * Play TargetSpot prerolls<br>
 * Display TargetSpot synchronised bigbox (300x250) banners (stream is muted during TargetSpot ad spots) and volume synchronisation between live stream and targetspot api volume.
 * <br><br>
 * TODO in front-end (client-side):<br>
 * Add the TargetSpot API in the HTML page in the section <head>:<br>
 * Production Url: http://player.cdn.targetspot.com/ts_embed_functions_as3.php (StationId KRAYFM, preroll is active, banners are active)<br>
 * Demo Url: http://demo.targetspot.com/ts_embed_functions_as3.php (StationId KRAYFM, preroll is active, banners are Inactive)<br><br>
 * <h5>Events fired:</h5><br>
 * module-ready<br>
 * module-error<br>
 * targetspot-ready<br>
 * targetspot-mute<br>
 * targetspot-unmute<br>
 * targetspot-no-ads<br>
 * targetspot-no-preroll<br>
 * targetspot-ad-started<br>
 * targetspot-ad-finished
 */
define(['dojo/_base/declare', 'dojo/_base/lang', 'sdk/modules/base/CoreModule', 'dojo/dom', 'dojo/dom-construct'], function (declare, lang, coreModule, dom, domConstruct) {
  /**
   * @namespace tdapi/modules/TargetSpot
   */
  var targetspot = declare([coreModule], {
    constructor: function (config, target) {
      console.log('targetSpot::constructor');

      this.inherited(arguments);
    },

    start: function () {
      console.log('targetSpot::start');

      this.emit('module-ready', { id: 'TargetSpot', module: this });
    },

    /**
     * Embed the TargetSpot Player API in containerId
     *
     * @param {string} containerId The DOM element id for the TargetSpot container
     * @param {string} stationId TargetSpot Station ID
     * @param {number} volume Volume setting for TargetSpot Audio, between 0-100
     * @param {string} prl Preroll values:<ul>
     * <li>auto = Playback automatically, as soon as the preroll ad is buffered</li>
     * <li>ignore = Default: No preroll ad plays</li>
     * <li>wait = Buffers the preroll ad, but waits for the tsPlayPreroll event to call for playback</li></ul>
     */
    embed: function (containerId, stationId, volume, prl) {
      console.log('targetSpot::embed - containerId=' + containerId + ', stationId=' + stationId + ', volume=' + volume + ', prl=' + prl);

      var tsWrapper = domConstruct.create('div', { id: 'tsWrapper' }, dom.byId(containerId, document));

      //Listen for API callbacks
      window.ts_ready = lang.hitch(this, this._tsReady);

      //Embed the TargetSpot Player (try-catch in case the JavaScript file (ts_embed_functions_as3.php) was ad-blocked or not present in the page)
      try {
        window.ts_swf_embed(tsWrapper.id, this._getComponentSettings(stationId, volume, prl));
      } catch (e) {
        this.emit('module-error', { id: 'TargetSpot', error: 'Error in targetSpot::embed: ' + e.message });
      }
    },

    /**
     * Parameters needed to properly start-up the TargetSpot Player
     * @return {Object}
     *
     * w width
     * h height
     * prl Preroll Value:
     *  - auto = Playback automatically, as soon as the preroll ad is buffered
     *  - ignore = Default: No preroll ad plays
     *  - wait = Buffers the preroll ad, but waits for the tsPlayPreroll event to call for playback
     *  pageDomain Defines calling page domain URL. [Optional.]
     *  htmlBanner
     *  s TargetSpot Station ID String
     *  v The volume setting for TargetSpot Audio, between 0-100
     *
     *  @ignore
     */
    _getComponentSettings: function (stationId, volume, prl) {
      return { w: 300, h: 250, prl: prl, pageDomain: 'player.tritondigital.com', htmlBanner: 0, s: stationId, v: volume };
    },

    /**
     * Play a TargetSpot Ad
     * @param {number} duration
     */
    playAd: function (duration) {
      console.log('targetSpot::playAd - duration=' + duration);

      window.ts_streamEvent({ eventType: 'playAd', eventDuration: duration });
    },

    /**
     * Play TargetSpot preroll (prl must have been set to 'wait' to be able to play a preroll).
     */
    playPreroll: function () {
      console.log('targetSpot::playPreroll');

      window.ts_streamEvent({ eventType: 'tsPlayPreroll' });
    },

    interruptAd: function () {
      console.log('targetSpot::interruptAd');

      window.ts_streamEvent({ eventType: 'interruptAd' });
    },

    /**
     * Set the TargetSpot Station Id
     * @param {string} stationId
     */
    setStationId: function (stationId) {
      console.log('targetSpot::setStationId - stationId=' + stationId);

      window.ts_setStation({ stationId: stationId });
    },

    /**
     * Set the TargetSpot Api volume
     * @param volume (0-100)
     */
    setVolume: function (volume) {
      console.log('targetSpot::setStationId - volume=' + volume);

      window.ts_setVolume({ volume: volume });
    },

    ts_setTargeting: function (eventType, eventData) {
      console.log('targetSpot::ts_setTargeting - eventType=' + eventType + ', eventData=' + eventData);

      window.ts_setTargeting({ eventType: eventType, eventData: eventData });
    },

    /**
     * ts_ready is when TargetSpot is initialized and ready to accept API events.
     * Until the Partner Player receives this callback, any ad or preroll requests will be ignored.
     * @private
     */
    _tsReady: function () {
      console.log('targetSpot::_tsReady - TargetSpot API is ready');

      window.ts_mutePlayer = lang.hitch(this, this._ts_mutePlayer);
      window.ts_unmutePlayer = lang.hitch(this, this._ts_unmutePlayer);
      window.ts_noAds = lang.hitch(this, this._ts_noAds);
      window.ts_noPreRoll = lang.hitch(this, this._ts_noPreRoll);
      window.ts_adStarted = lang.hitch(this, this._ts_adStarted);
      window.ts_adFinished = lang.hitch(this, this._ts_adFinished);

      this.emit('targetspot-ready');
    },

    /**
     * signals the Partner Player to Mute its radio stream volume – because a TargetSpot ad break is beginning playback.
     * @param duration
     * @private
     */
    _ts_mutePlayer: function (duration) {
      console.log('targetSpot::_ts_mutePlayer - TargetSpot mute player callback fired');

      this.emit('targetspot-mute');
    },

    /**
     * signals the Partner Player to restore radio stream volume – because a TargetSpot ad playback is finished.
     * @private
     */
    _ts_unmutePlayer: function () {
      console.log('targetSpot::_ts_unmutePlayer - TargetSpot un-mute player callback fired');

      this.emit('targetspot-unmute');
    },

    /**
     * signals that your player has requested an instream ad-‐break, but there was no appropriate ad content to serve the user at that time.
     * This is the place to react to that situation.
     * ts_unmutePlayer() is also called immediately after ts_noAds(). This was intended as a safety measure to ensure that the streaming player does not accidentally keep the stream muted.
     * @private
     */
    _ts_noAds: function () {
      console.log('targetSpot::_ts_noAds - TargetSpot no ads callback fired');

      this.emit('targetspot-no-ads');
    },

    /**
     * means your Player has requested a preroll video ad, but there was no appropriate ad content to serve that user at that time. This is the place to react to that situation.
     * @private
     */
    _ts_noPreRoll: function () {
      console.log('targetSpot::_ts_noPreRoll - TargetSpot no preroll callback fired');

      this.emit('targetspot-no-preroll');
    },

    /**
     * This callback is when TargetSpot has started playing a specific ad. This is the place to react to that situation. The majority of the time, it is not necessary to implement this function.
     * @param adObj (adObj.adid number - Representing the id of the Ad Unit)
     * @private
     */
    _ts_adStarted: function (adObj) {
      console.log('targetSpot::_ts_adStarted - TargetSpot ad started callback fired');

      this.emit('targetspot-ad-started');
    },

    /**
     * This callback is when TargetSpot has finished playing a specific ad. This is the place to react to that situation. The majority of the time, it is not necessary to implement this function.
     * @param adObj (adObj.adid number - Representing the id of the Ad Unit)
     * @private
     */
    _ts_adFinished: function (adObj) {
      console.log('targetSpot::_ts_adFinished - TargetSpot ad finished callback fired');

      this.emit('targetspot-ad-finished');
    }
  });

  return targetspot;
});
