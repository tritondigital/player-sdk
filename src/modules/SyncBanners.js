define(['dojo/_base/declare', 'dojo/_base/lang', 'dojo/_base/array', 'dojo/dom', 'dojo/on', 'dojo/dom-construct', 'sdk/modules/base/CoreModule', 'sdk/base/util/Companions'], function (
  declare,
  lang,
  array,
  dom,
  on,
  domConstruct,
  coreModule,
  Companions
) {
  /**
   * @namespace tdapi/modules/SyncBanners
   */
  var module = declare([coreModule], {
    LEGACY: 'legacy',
    VAST: 'vast',

    constructor: function (config, target) {
      console.log('syncBanners::constructor');

      this.inherited(arguments);

      this._vastCompanionPriority = config.vastCompanionPriority || ['static', 'iframe', 'html'];

      this.companions = new Companions();
    },

    start: function () {
      console.log('syncBanners::start');

      if (this.config.elements) {
        console.log(this.config.elements);

        on(this.target, 'vast-process-complete', lang.hitch(this, this._onVastProcessComplete));
        on(this.target, 'vast-companions-ready', lang.hitch(this, this._onVastCompanionsReady));
        on(this.target, 'ad-break-cue-point', lang.hitch(this, this._onAdBreakCuePoint));
        on(this.target, 'ad-break-cue-point-complete', lang.hitch(this, this._onAdBreakCuePointComplete));
        on(this.target, 'stream-stop', lang.hitch(this, this._onStreamStop));
      }

      this.emit('module-ready', { id: 'SyncBanners', module: this });
    },

    getSyncedElementBySize: function (width, height) {
      var element = null;

      array.forEach(
        this.config.elements,
        function (item) {
          if (item.width == width && item.height == height) element = item;
        },
        this
      );

      return element;
    },

    _onAdBreakCuePoint: function (e) {
      console.log('syncBanners::_onAdBreakCuePoint');
      console.log(e.data);

      var adBreakData = e.data.adBreakData;
      var adUrl = adBreakData.url;

      if (adBreakData.isVastInStream) {
        this._cleanAdVastListeners();

        this.vastProcessCompleteListener = on(this.target, 'vast-process-complete', lang.hitch(this, this._onVastProcessComplete));
        this.vastErrorListener = on(this.target, 'ad-playback-error', lang.hitch(this, this._onVastAdPlaybackError));
      } else if (adUrl && adUrl.length > 1 && adUrl.indexOf('|') != -1) {
        var primaryElementUrl = adUrl.split('|')[1];
        var secondaryElementUrl = adUrl.split('|')[0];

        if (primaryElementUrl && primaryElementUrl.length > 1 && this.getSyncedElementBySize(300, 250) != null) {
          console.log('syncBanners::_onAdBreakCuePoint - Ad Break - Loading the primary HTML synced element - url=' + primaryElementUrl);

          this.emit('ad-break-synced-element', {
            type: this.LEGACY,
            id: this.getSyncedElementBySize(300, 250).id,
            url: primaryElementUrl
          });

          this._loadElementIframe(this.getSyncedElementBySize(300, 250).id, primaryElementUrl, 300, 250);
        }

        if (secondaryElementUrl && secondaryElementUrl.length > 1 && this.getSyncedElementBySize(728, 90) != null) {
          console.log('syncBanners::_onAdBreakCuePoint - Ad Break - Loading the secondary HTML synced element - url=' + secondaryElementUrl);

          this.emit('ad-break-synced-element', {
            type: this.LEGACY,
            id: this.getSyncedElementBySize(728, 90).id,
            url: secondaryElementUrl
          });

          this._loadElementIframe(this.getSyncedElementBySize(728, 90).id, secondaryElementUrl, 728, 90);
        }
      }
    },

    _onAdBreakCuePointComplete: function (e) {
      console.log('syncBanners::_onAdBreakCuePointComplete');

      if (!this.config.keepElementsVisible) this._hideElements();
    },

    _onStreamStop: function () {
      this._hideElements();
    },

    _hideElements: function () {
      console.log('syncBanners::_hideElements');

      var bigboxElement = this.getSyncedElementBySize(300, 250);
      if (bigboxElement != null && dom.byId(bigboxElement.id, document) != null) {
        domConstruct.empty(dom.byId(bigboxElement.id, document));
      }

      var lbElement = this.getSyncedElementBySize(728, 90);
      if (lbElement != null && dom.byId(lbElement.id, document) != null) {
        domConstruct.empty(dom.byId(lbElement.id, document));
      }
    },

    _loadElementIframe: function (containerId, adSpotUrl, width, height) {
      var container = dom.byId(containerId, document);

      if (container == null) return;

      domConstruct.empty(container);
      domConstruct.create(
        'iframe',
        {
          src: adSpotUrl,
          width: width,
          height: height,
          scrolling: 'no',
          frameborder: 0,
          marginheight: 0,
          marginwidth: 0,
          allowtransparency: true,
          style: { margin: 0, padding: 0 }
        },
        container
      );
    },

    /**
     * _showVastCompanions
     */
    _showVastCompanions: function (e) {
      console.log('syncBanners::_showVastCompanions');

      console.log(this.config);

      this._cleanAdVastListeners();

      var vastCompanions = this._filterCompanionAds(e.data.companions);

      if (vastCompanions && vastCompanions.length) {
        array.forEach(
          vastCompanions,
          function (item, index) {
            var syncAdElement = this.getSyncedElementBySize(item.width, item.height);
            if (syncAdElement != null && dom.byId(syncAdElement.id, document) != null) {
              this.emit('ad-break-synced-element', {
                type: this.VAST,
                id: syncAdElement.id,
                data: vastCompanions[index]
              });

              this.companions.loadVASTCompanionAd(syncAdElement.id, vastCompanions[index]);
            }
          },
          this
        );
      }
    },

    _onVastProcessComplete: function (e) {
      console.log('syncBanners::_onVastProcessComplete');
      this._showVastCompanions(e);
    },

    _onVastCompanionsReady: function (e) {
      console.log('SyncBanners::_onVastCompanionsReady');
      this._showVastCompanions(e);
    },

    _onVastAdPlaybackError: function (e) {
      console.error('syncBanners::_onVastAdPlaybackError');
      console.error(e);

      this._cleanAdVastListeners();
    },

    _cleanAdVastListeners: function () {
      if (this.vastProcessCompleteListener) this.vastProcessCompleteListener.remove();

      if (this.vastErrorListener) this.vastErrorListener.remove();
    },

    _filterCompanionAds: function (companionAds) {
      if (!companionAds || !companionAds.length) return companionAds;

      var companions = [];
      var size = [];

      array.forEach(
        this._vastCompanionPriority,
        function (item) {
          array.forEach(
            companionAds,
            function (companionAd) {
              var companionAdSize = companionAd.width + companionAd.height;
              if (companionAd.resourceType.name == item && array.indexOf(size, companionAdSize) < 0) {
                companions.push(companionAd);
                size.push(companionAdSize);
              }
            },
            this
          );
        },
        this
      );

      return companions;
    }
  });

  return module;
});
