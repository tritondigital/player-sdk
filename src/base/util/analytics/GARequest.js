var Platform = require('sdk/base/util/Platform');

/**
 * @module GARequest
 */
define(['dojo/_base/declare', 'dojo/_base/lang', 'dojo/cookie', 'sdk/base/util/XhrProvider'], function (declare, lang, cookie, XhrProvider) {
  /**
   * @namespace tdapi/modules/analytics/GARequest
   */
  var GARequest = declare([], {
    GA_ENDPOINT: 'https://www.googletagmanager.com/gtag/js?id=',
    GA_ENDPOINT_DEBUG: 'https://www.googletagmanager.com/gtag/js?id=',

    COOKIE_NAME: 'sdk_cid',
    TYPE: 'hitType',

    //event
    CATEGORY: 'eventCategory',
    ACTION: 'eventAction',
    LABEL: 'eventLabel',

    //dimensions
    DIM_TECH: 'cd1',
    DIM_MEDIA_TYPE: 'cd2',
    DIM_MOUNT: 'cd3',
    DIM_STATION: 'cd4',
    DIM_BROADCASTER: 'cd5',
    DIM_MEDIA_FORMAT: 'cd6',
    DIM_AD_SOURCE: 'cd8',
    DIM_AD_FORMAT: 'cd9',
    DIM_AD_PARSER: 'cd10',
    DIM_ADBLOCK: 'cd11',
    DIM_SBM: 'cd12',
    DIM_HLS: 'cd13',
    DIM_AUDIO_ADAPTIVE: 'cd14',
    DIM_IDSYNC: 'cd15',
    DIM_ALTERNATE_CONTENT: 'cd16',
    DIM_AD_COMPANIONS_TYPE: 'cd17',
    DIM_ERROR_MESSAGE: 'cd18',

    //metrics
    METRIC_CONNECTION_TIME: 'cm1',
    METRIC_STREAM_ERROR_TIME: 'cm2',
    METRIC_LOAD_TIME: 'cm3',

    //toggle
    active: true,

    /**
     * constructor
     */
    constructor: function () {
      console.log('GARequest::constructor');

      this.tid = null;
      this.v = 1;
      this.cid = null;
      this.an = 'web-sdk';
      this.av = null;
      this.aid = null;
      this.appInstallerId = 'custom'; // custom, widget, player, tdtestapp
      this.active = true;
      this.debug = false;
      this.category = null;

      this.sampleRate = 5; // Percentage.
    },

    /**
     * Set properties from configuration.
     * @param {boolean} active Should analytics be logged or not
     * @param {string} appInstallerId e.g. tdtestapp
     * @param {boolean} debug Logs to the console (uses different endpoint)
     * @param {string} platformId To get environment
     * @param {string} trackingId Universal tracking ID
     * @param {string} sampleRate (%) Limits the amount of logging
     * @param {Array<string>} trackingEvents Array of events you yould log
     */
    setProperties: function (
      active = true,
      appInstallerId = '',
      debug = false,
      platformId = 'prod01',
      trackingId = null,
      sampleRate = 5,
      trackingEvents = [this.ACTION_PLAY, this.ACTION_STOP, this.ACTION_PAUSE, this.ACTION_RESUME],
      category = null
    ) {
      this.setActive(active);
      this.appInstallerId = appInstallerId;
      this.debug = debug;
      this.setPlatform(platformId, trackingId);
      // Note: Log will abort if sampleRate is in the percentage threshold:
      this.sampleRate = sampleRate;
      this.category = category;

      // Change all items to uppercase:
      this.trackingEvents = trackingEvents.map(item => item.toUpperCase());

      //If the all event is included we have to map it to the supported events otherwise we get other events that should not be included for clients.
      if (this.trackingEvents.includes(this.ACTION_ALL.toUpperCase())) {
        this.trackingEvents = [this.ACTION_PLAY.toUpperCase(), this.ACTION_STOP.toUpperCase(), this.ACTION_PAUSE.toUpperCase(), this.ACTION_RESUME.toUpperCase()];
      }
    },

    isGoogleAnalytics4: function () {
      var trackingType = this.tid.split('-')[0];
      return trackingType === 'G';
    },

    loadGoogleAnalytics: function () {
      this.isGoogleAnalytics4() ? this.loadGoogleAnalytics4() : this.loadLegacyGoogleAnalytics();
    },

    loadGoogleAnalytics4: function () {
      console.log('GARequest::loadGoogleAnalytics4');
      var trackingId = this.tid;
      var win = window;
      var doc = document;
      var scriptTag;
      var scriptTagElement;
      var analyticsUrl = 'https://www.googletagmanager.com/gtag/js?id=' + trackingId;
      var script = 'script';
      var googleTag = 'gtag';

      win.dataLayer = window.dataLayer || [];
      win[googleTag] = win[googleTag] || gtag;

      scriptTag = doc.createElement(script);
      scriptTag.async = 1;
      scriptTag.src = analyticsUrl;

      scriptTagElement = doc.getElementsByTagName(script)[0];
      scriptTagElement.parentNode.insertBefore(scriptTag, scriptTagElement);

      function gtag() {
        dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('config', trackingId, {
        cookieDomain: 'auto',
        sampleRate: this.sampleRate,
        trackingId: trackingId,
        appId: this.aid,
        appInstallerId: this.appInstallerId,
        appName: this.an,
        appVersion: this.av,
        clientId: this.cid,
        name: 'tritonWebSdkTracker'
      });
    },

    /**
     * Create and append Google Analytics script (using analytics.js).
     * Note, "ga" will be defined globally.
     */
    /* eslint-disable no-undef */
    loadLegacyGoogleAnalytics: function () {
      console.log('GARequest::loadLegacyGoogleAnalytics');
      var s, m;
      var i = window;
      var d = document;
      var o = 'script';
      var g = !this.debug ? 'https://www.google-analytics.com/analytics.js' : 'https://www.google-analytics.com/analytics_debug.js';
      var r = 'ga';
      i['GoogleAnalyticsObject'] = r;
      (i[r] =
        i[r] ||
        function () {
          (i[r].q = i[r].q || []).push(arguments);
        }),
        (i[r].l = 1 * new Date());
      (s = d.createElement(o)), (m = d.getElementsByTagName(o)[0]);
      s.async = 1;
      s.src = g;
      m.parentNode.insertBefore(s, m);
      // Create and make pageview to start a session (pageview has to start otherwise events can't be logged)
      ga('create', {
        cookieDomain: 'auto',
        sampleRate: this.sampleRate,
        trackingId: this.tid,
        appId: this.aid,
        appInstallerId: this.appInstallerId,
        appName: this.an,
        appVersion: this.av,
        clientId: this.cid,
        name: 'tritonWebSdkTracker'

        // This is set automatically:
        // version: this.v,
      });
      // TODO: See if we can remove this:
      ga('tritonWebSdkTracker.send', 'pageview');
    },

    /**
     * setActive
     * @param active | Boolean
     */
    setActive: function (active) {
      this.active = active;
      if (active) {
        this.cid = this.getCookie();
      } else {
        this.delete_cookie();
      }
    },

    /**
     * Set platform and tracking ID.
     * @param platformId | String
     * @param trackingId Universal Tracking ID
     */
    setPlatform: function (platformId, trackingId) {
      if (window.location.hostname === 'localhost' || window.location.hostname.search('10.100') > -1) {
        this.platform = new Platform('dev01');
      } else {
        this.platform = new Platform(platformId);
      }

      // If a client provided a tracking ID it should be used, otherwise, use the Triton tracking ID.
      this.tid = trackingId ? trackingId : this.platform.endpoint.UA;
    },

    /**
     * request
     * @param object | object
     */
    request: function (object) {
      console.log('GARequest::request');
      if (this.category) {
        object.eventCategory = this.category;
      }
      this.isGoogleAnalytics4() ? gtag('event', 'tritonWebSdkTracker.send', object) : ga('tritonWebSdkTracker.send', object);
    },

    /**
     * delete_cookie
     * @param name | String
     */
    delete_cookie: function (name) {
      cookie(this.COOKIE_NAME, '', {
        expires: 'Thu, 01 Jan 1970 00:00:01 GMT',
        path: '/'
      });
    },

    /**
     * getCookie
     */
    getCookie: function () {
      var cname = this.COOKIE_NAME;
      var name = cname + '=';
      var ca = document.cookie.split(';');

      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
      }

      //generate new cookie
      return _setCookie(this.COOKIE_NAME);
    }
  });

  /**
   * _setCookie
   *  @param cookieName | String
   * private
   */
  function _setCookie(cookieName) {
    var cid = _generateCid();
    var d = new Date();
    var exdays = 365;

    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    var expires = 'expires=' + d.toUTCString();
    cookie(cookieName, cid, { expires: expires, path: '/' });

    return cid;
  }

  /**
   * _generateCid
   * private
   */
  function _generateCid() {
    var d = new Date().getTime();

    var cid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x7) | 0x8).toString(16);
    });

    return cid;
  }

  return GARequest;
});
