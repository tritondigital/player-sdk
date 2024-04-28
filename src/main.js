/**
 * @module TdPlayerApi
 *
 * @desc
 * TdPlayerApi is the api entry-point, and must be instantiated on client-side page.<br>
 * <h5>Events fired:</h5><br>
 * player-ready
 *
 * @example
 * The parameter techPriority (optional, case-sensitive) define the technology priorities to apply. By default the technology order is Html5, then Flash if HTML5 is not supported. You can define only one technology, either Html5 or Flash, or two technologies in your order of preference.
 * The 'timeShift' configuration object is optional, by default the timeShifting is inactive and is Flash only, HTML5 to be tested in future versions of the api.
 * If max_listening_time is undefined, the default value will be 30 minutes.
 * The plugins array is specific to the MediaPlayer module for the Flash controller - Each plugin contains id (String) and other optional config
 * <pre class="javascript">
 *     var tdPlayerConfig = {
 *     coreModules:[
 *       {
 *       id: 'MediaPlayer'//,
 *       playerId: 'td_container',
 *       //techPriority: ['Html5', 'Flash'],
 *       //timeShift: {
 *       //active: 0,
 *       //max_listening_time: 30
 *       //},
 *       plugins: [ {id:"vastAd"}, {id:"bloom"}, {id:"mediaAd"} ]
 *       },
 *       //{ id: 'NowPlayingApi' },
 *       //{ id: 'Npe' },
 *       //{ id: 'PlayerWebAdmin' },
 *       //{ id: 'SyncBanners', elements:[{id:'td_synced_bigbox', width:300, height:250}] },
 *       //{ id: 'TargetSpot' }
 *     ]
 *     };
 *     var player = new TdPlayerApi(tdPlayerConfig);
 *     player.addEventListener('player-ready', onPlayerReadyHandler);
 *     function onPlayerReadyHandler() {
 *      //Play a stream (through the MediaPlayer module):
 *      player.MediaPlayer.play('TRITONRADIOMUSIC');
 *     }
 *
 * </pre>
 * @authors Triton Digital (c)
 */
//
var declare = require('dojo/_base/declare');
var lang = require('dojo/_base/lang');
var on = require('dojo/on');
var Evented = require('dojo/Evented');
var array = require('dojo/_base/array');
var ModuleManager = require('sdk/ModuleManager');
var BannerCapabilityFlags = require('sdk/base/ad/BannerCapabilityFlags');
var BlockAdBlock = require('sdk/base/util/BlockAdBlock');
var GAEventRequest = require('sdk/base/util/analytics/GAEventRequest');
var i18n = require('sdk/base/util/I18n');

var MediaElement = require('sdk/base/util/MediaElement');

// unlock html audio
var touchmove = false;
var InitMediaElement = function () {
  if (!touchmove) {
    document.removeEventListener('touchend', InitMediaElement, false);
    document.removeEventListener('touchmove', isTouchWithMove, false);
    MediaElement.init();
  }
  touchmove = false;
};
var isTouchWithMove = function () {
  touchmove = true;
};
document.addEventListener('touchend', InitMediaElement, false);
document.addEventListener('touchmove', isTouchWithMove, false);

window.TDSdk = declare([], {
  NAME: 'TDSdk',

  /**
   * TdPlayerApi constructor, instantiate the ModuleManager
   * @constructor TdPlayerApi
   * @param playerConfig
   *
   * @ignore
   */
  constructor: function (playerConfig) {
    console.log('TDSdk::constructor - v' + this.version.value + '.' + this.version.build + '.' + this.version.flag + ' - codename: ' + this.version.codename);

    this.listeners = [];
    this.target = new Evented();
    this.abBlockProcessFinish = false;
    this.MediaElement = MediaElement;
    this._initGoogleAnalytics();

    on(this.target, 'module-ready', lang.hitch(this, this._onModuleReady));

    var blockAdBlock = new BlockAdBlock();

    if (typeof blockAdBlock.fab === 'undefined') {
      this._onAdBlock(playerConfig, true);
    } else {
      blockAdBlock.fab.onDetected(lang.hitch(this, this._onAdBlock, playerConfig, true));
      blockAdBlock.fab.onNotDetected(lang.hitch(this, this._onAdBlock, playerConfig, false));
      blockAdBlock.fab.check();
    }

    if (playerConfig.playerReady) {
      this.addEventListener('player-ready', playerConfig.playerReady);
    }

    if (playerConfig.configurationError) {
      this.addEventListener('configuration-error', playerConfig.configurationError);
    }

    if (playerConfig.moduleError) {
      this.addEventListener('module-error', playerConfig.moduleError);
    }

    if (playerConfig.adBlockerDetected) {
      this.addEventListener('ad-blocker-detected', playerConfig.adBlockerDetected);
    }

    this.loadModules();
  },

  /**
   * Get GAEventRequest
   */

  getGAEventRequest: function () {
    return GAEventRequest;
  },

  /**
   * Parse the SyncBanners module config elements values and add elements width x height to the MediaPlayer module config object for ad targeting
   *
   * @param playerConfig
   * @returns {object}
   * @private
   */
  _parseConfig: function (playerConfig, isBlocked) {
    if (!playerConfig || !playerConfig.coreModules) {
      return {
        coreModules: []
      };
    }

    var banners = [];
    var companionAdSelectionSettings = {};

    var filteredArr = array.filter(playerConfig.coreModules, function (item) {
      return item.id == 'SyncBanners';
    });

    if (filteredArr.length && !isBlocked) {
      var syncBanners = filteredArr[0];
      companionAdSelectionSettings = syncBanners;
      array.forEach(
        syncBanners.elements,
        function (element) {
          if (element.width != undefined && element.height != undefined) {
            var token = element.width + 'x' + element.height;
            if (array.indexOf(BannerCapabilityFlags, token) != -1) {
              banners.push(token);
            }
          }
        },
        this
      );
    }

    filteredArr = array.filter(playerConfig.coreModules, function (item) {
      return item.id == 'MediaPlayer';
    });

    if (filteredArr.length) {
      var mediaPlayer = filteredArr[0];
      mediaPlayer.adBlockerDetected = isBlocked;

      //Remove ad module if adBlock
      if (mediaPlayer.adBlockerDetected && mediaPlayer.plugins != undefined) {
        this._removeMediaplayerPlugins('vastAd', mediaPlayer.plugins);
        this._removeMediaplayerPlugins('mediaAd', mediaPlayer.plugins);
      }

      mediaPlayer.companionAdSelectionSettings = companionAdSelectionSettings; //IMA SDK settings

      if (mediaPlayer.defaultTrackingParameters == undefined) {
        mediaPlayer.defaultTrackingParameters = {};
      }

      mediaPlayer.defaultTrackingParameters.banners =
        mediaPlayer.defaultTrackingParameters.banners != undefined ? this._unique(mediaPlayer.defaultTrackingParameters.banners.concat(banners)) : banners;

      mediaPlayer.defaultTrackingParameters.log = {};
      mediaPlayer.defaultTrackingParameters.log.tdsdk = 'js-' + this.version.value.substring(0, 3);
      mediaPlayer.defaultTrackingParameters.log.pname = this.NAME;
      mediaPlayer.defaultTrackingParameters.log.pversion = this.version.value.substring(0, 3);
    }

    if (playerConfig.analytics && typeof playerConfig.analytics === 'object') {
      if (playerConfig.analytics.active) {
        GAEventRequest.setProperties(
          playerConfig.analytics.active,
          playerConfig.analytics.appInstallerId,
          playerConfig.analytics.debug,
          playerConfig.analytics.platformId,
          playerConfig.analytics.trackingId,
          playerConfig.analytics.sampleRate,
          playerConfig.analytics.trackingEvents,
          playerConfig.analytics.category
        );

        GAEventRequest.loadGoogleAnalytics();
      } else {
        GAEventRequest.setActive(false);
      }
    } else {
      GAEventRequest.setActive(false);
    }
    //overide locale
    if (typeof playerConfig.locale === 'string') {
      i18n.setLocalization(playerConfig.locale);
    }

    console.log('TDSdk::_parseConfig - playerConfig:');

    return playerConfig;
  },

  _removeMediaplayerPlugins: function (pluginToRemove, pluginsArray) {
    array.forEach(pluginsArray, function (item, i) {
      if (item && item.id == pluginToRemove) {
        pluginsArray.splice(i, 1);
      }
    });
  },

  _onModuleReady: function (e) {
    //mix-in the api object from the loaded module with the module-api object. @see modules/MediaPlayer::api. Example: instead of myPlayer.MediaPlayer.play, the alias is: myPlayer.play
    if (e.data.module.api) declare.safeMixin(this, e.data.module.api);

    //Create a module alias. Each loaded module will be accessible directly from this class. Example: myPlayer.MediaPlayer.play(...) This is equivalent to myPlayer.getModuleById('MediaPlayer').play(...)
    this[e.data.id] = e.data.module;
  },

  /**
   * _onAdBlock
   * Ad Blocker handler
   */
  _onAdBlock: function (playerConfig, isBlocked) {
    console.log('_onAdBlock', isBlocked);
    if (!playerConfig) return;

    this.abBlockProcessFinish = true;
    playerConfig.adBlockerDetected = isBlocked;
    this.moduleManager = new ModuleManager(this._parseConfig(playerConfig, isBlocked), this.target);

    /**
     * if this.loadModules() public function has been previously called, we call this.moduleManager.loadModules() now.
     *
     * */
    if (this.loadModulesCalled) {
      this.moduleManager.loadModules();
    }
  },

  /**
   * Load all the module(s) listed in the config.coreModules array.
   * This is useful to load a set of modules when the application starts.
   */
  loadModules: function () {
    /**
     * We need to wait for ad Block detection process to finish
     * If this process is not finished, we set a loadModulesCalled var to true, then the moduleManager.loadModules() function will be called when this process will be finished
     *
     */
    //@TODO: remove loadModules from public functions. Has to be called internally
    if (this.abBlockProcessFinished) {
      this.moduleManager.loadModules();
    } else {
      this.loadModulesCalled = true;
    }
  },

  /**
   * Load a module by specifying it's id
   * This is useful to load a module on the fly.
   * @param {string} moduleId The module id in the tdapi/modules namespace (example: 'TargetSpot').
   * @param {object} moduleConfig The module configuration
   */
  loadModule: function (moduleId, moduleConfig) {
    this.moduleManager.loadModule(moduleId, moduleConfig);
  },

  /**
   * Get a reference to a module instance<br>
   * Important: Note that each module can be accessed directly, example: myPlayer.MediaPlayer instead of myPlayer.getModuleById('MediaPlayer'). Handy :)
   *
   * @param {string} moduleId The module id (example: MediaPlayer)
   * @return {CoreModule} instance of the module
   */
  getModuleById: function (moduleId) {
    return this.moduleManager.getModuleById(moduleId);
  },

  _initGoogleAnalytics: function () {
    console.log('_initGoogleAnalytics');
    GAEventRequest.av = this.version.value + '.' + this.version.build;
    GAEventRequest.aid = this.version.value;
  },

  /**
   * Add an event listener on the api
   * @param {string} eventName The event name
   * @param {function} callback The callback function
   */
  addEventListener: function (eventName, callback) {
    //Check if the listener exist before adding it
    var itemIndex = -1;

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
        listener: on(this.target, eventName, lang.hitch(this, callback))
      });
  },

  /**
   * Remove an event listener on the api
   * @param {string} eventName The event name
   * @param {function} callback The callback function
   */
  removeEventListener: function (eventName, callback) {
    var itemIndex = -1;

    array.forEach(
      this.listeners,
      function (item, index) {
        if (item.eventName == eventName && item.callback == callback) itemIndex = index;
      },
      this
    );

    if (itemIndex > -1) {
      this.listeners[itemIndex].listener.remove(); //FIXME: is it necessary to call remove() on the listener ? the listener is spliced from the listeners array anyway...
      this.listeners.splice(itemIndex, 1);
    }
  },

  /**
   * Return a unique Array
   * @param arr
   * @returns {*|Array}
   * @private
   */
  _unique: function (arr) {
    var test = {};
    return array.filter(arr, function (val) {
      return test[val] ? false : (test[val] = true);
    });
  },

  /**
   * Version number of the Td Player Api
   */
  version: {
    value: '@tdversion@',
    build: '@tdbuild@',
    codename: 'bitter lime'
  },

  flash: {
    available: swfobject.getFlashPlayerVersion().major > 0,
    version: swfobject.getFlashPlayerVersion()
  }
});
