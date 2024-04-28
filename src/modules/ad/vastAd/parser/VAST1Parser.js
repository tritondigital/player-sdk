var xmlParser = require('sdk/base/util/XmlParser');

/**
 *
 * VAST 1.0 XML Parser
 *
 */
define([
  'dojo/_base/declare',
  'sdk/modules/ad/vastAd/parser/VASTParser',
  'sdk/modules/ad/vastAd/parser/VASTElement',
  'sdk/modules/ad/vastAd/VASTDocument',
  'sdk/modules/ad/vastAd/VASTAd',
  'sdk/modules/ad/vastAd/VAST1InlineAd',
  'sdk/modules/ad/vastAd/VASTWrapperAd',
  'sdk/modules/ad/vastAd/VASTVideo',
  'sdk/modules/ad/vastAd/VASTVideoClick',
  'sdk/modules/ad/vastAd/VASTTrackingEvent',
  'sdk/modules/ad/vastAd/VASTCompanionAd',
  'sdk/modules/ad/vastAd/VASTMediaFile',
  'sdk/modules/ad/vastAd/VASTResourceType'
], function (declare, VASTParser, VASTElement, VASTDocument, VASTAd, VAST1InlineAd, VASTWrapperAd, VASTVideo, VASTVideoClick, VASTTrackingEvent, VASTCompanionAd, VASTMediaFile, VASTResourceType) {
  var vast1parser = declare([VASTParser], {
    AD: 'Ad',
    VAST_AD_TAG_URL: 'VASTAdTagURL',
    VIDEO: 'Video',
    URL: 'URL',
    CODE: 'Code',
    RESOURCE_TYPE: 'resourceType',

    constructor: function () {
      console.log('vast1parser::constructor');

      this.vastDocument = null;

      this.inherited(arguments);
    },

    parse: function (xml) {
      console.log('vast1parser::parse');

      this.vastDocument = new VASTDocument();

      var adXML = xml.getElementsByTagName(this.AD);

      if (adXML[0] == undefined) return null;

      var id = adXML[0].getAttribute(VASTElement.ID);
      var vastAd = new VASTAd(id);

      this.vastDocument.vastAd = vastAd;

      this._parseAdTag(adXML);

      return this.vastDocument;
    },

    _parseAdTag: function (xml) {
      var xmlLength = xml.length;
      for (var i = 0; i < xmlLength; i++) {
        if (xml[i].getElementsByTagName(VASTElement.INLINE).length > 0) {
          this.vastDocument.vastAd.inlineAd = this._parseInLineTag(xml[i].getElementsByTagName(VASTElement.INLINE));
        } else if (xml[i].getElementsByTagName(VASTElement.WRAPPER).length > 0) {
          this.vastDocument.vastAd.wrapperAd = this._parseWrapperTag(xml[i].getElementsByTagName(VASTElement.WRAPPER));
        } else {
          console.error('VAST - parseAdTag() - Unsupported VAST tag');
        }
      }
    },

    _parseInLineTag: function (xml) {
      var vast1Inline = new VAST1InlineAd();

      var nodeArray = xml[0].childNodes;
      var nodeArrayLength = nodeArray.length;
      for (var i = 0; i < nodeArrayLength; i++) {
        if (nodeArray[i].nodeName == VASTElement.AD_SYSTEM) {
          vast1Inline.adSystem = xmlParser.textContent(nodeArray[i]);
        } else if (nodeArray[i].nodeName == VASTElement.AD_TITLE) {
          vast1Inline.adTitle = xmlParser.textContent(nodeArray[i]);
        } else if (nodeArray[i].nodeName == VASTElement.ERROR) {
          vast1Inline.errorURL = this.trim(xmlParser.textContent(nodeArray[i]));
        }
      }

      vast1Inline.video = this._parseVideo(xml[0].getElementsByTagName(this.VIDEO));
      vast1Inline.impressions = this._parseImpressions(xml[0].getElementsByTagName(VASTElement.IMPRESSION));
      var trackingEventsXML = xml[0].getElementsByTagName(VASTElement.TRACKING_EVENTS);
      if (trackingEventsXML != undefined && trackingEventsXML.length > 0) vast1Inline.trackingEvents = this._parseTrackingEvents(trackingEventsXML[0]);

      vast1Inline.companionAds = this._parseCompanionsAds(xml[0].getElementsByTagName(VASTElement.COMPANION_ADS));
      vast1Inline.nonLinearAds = this._parseNonLinearAds(xml[0].getElementsByTagName(VASTElement.NON_LINEAR_ADS));

      return vast1Inline;
    },

    _parseImpressions: function (xml) {
      var impressionsArray = [];

      if (xml == undefined || xml.length == 0) return impressionsArray;

      var urlArrayLength = xml[0].getElementsByTagName(this.URL).length;
      var urlArray = xml[0].getElementsByTagName(this.URL);

      for (var i = 0; i < urlArrayLength; i++) {
        impressionsArray.push(xmlParser.textContent(urlArray[i]));
      }

      return impressionsArray;
    },

    _parseVideo: function (xml) {
      var vastVideo = new VASTVideo();

      var nodeArray = xml[0].childNodes;
      var nodeArrayLength = nodeArray.length;
      for (var i = 0; i < nodeArrayLength; i++) {
        if (nodeArray[i].nodeName == VASTElement.DURATION) {
          vastVideo.duration = xmlParser.textContent(nodeArray[i]);
        } else if (nodeArray[i].nodeName == VASTElement.AD_ID) {
          vastVideo.adID = xmlParser.textContent(nodeArray[i]);
        } else if (nodeArray[i].nodeName == VASTElement.VIDEO_CLICKS) {
          vastVideo.videoClick = this._parseVideoClick(nodeArray[i]);
        } else if (nodeArray[i].nodeName == VASTElement.MEDIA_FILES) {
          vastVideo.mediaFiles = this._parseMediaFiles(nodeArray[i]);
        }
      }

      return vastVideo;
    },

    _parseVideoClick: function (xml) {
      var vastVideoClick = new VASTVideoClick();

      var nodeArray = xml.childNodes;
      var nodeArrayLength = nodeArray.length;
      var urls = null;
      for (var i = 0; i < nodeArrayLength; i++) {
        if (nodeArray[i].nodeName == VASTElement.CLICK_THROUGH) {
          urls = this._parseURLTags(nodeArray[i]);
          if (urls.length > 0) vastVideoClick.clickThrough = urls[0];
        } else if (nodeArray[i].nodeName == VASTElement.CLICK_TRACKING) {
          vastVideoClick.clickTrackings = this._parseURLTags(nodeArray[i]);
        } else if (nodeArray[i].nodeName == VASTElement.CUSTOM_CLICK) {
          vastVideoClick.customClicks = this._parseURLTags(nodeArray[i]);
        }
      }

      return vastVideoClick;
    },

    _parseMediaFiles: function (xml) {
      var vastMediaFiles = [];

      var mediaFiles = xml.getElementsByTagName(VASTElement.MEDIA_FILE);
      var mediaFilesLength = mediaFiles.length;
      var vastMediaFile;
      for (var i = 0; i < mediaFilesLength; i++) {
        vastMediaFile = new VASTMediaFile();
        vastMediaFile.id = mediaFiles[i].getAttribute(VASTElement.ID);
        vastMediaFile.bitrate = mediaFiles[i].getAttribute(VASTElement.BITRATE);
        vastMediaFile.height = mediaFiles[i].getAttribute(VASTElement.HEIGHT);
        vastMediaFile.width = mediaFiles[i].getAttribute(VASTElement.WIDTH);
        vastMediaFile.delivery = mediaFiles[i].getAttribute(VASTElement.DELIVERY);
        vastMediaFile.type = mediaFiles[i].getAttribute(VASTElement.TYPE);
        vastMediaFile.url = this.trim(this.getTagValue(mediaFiles[i], 'URL'));
        vastMediaFiles.push(vastMediaFile);
      }

      return vastMediaFiles;
    },

    _parseTrackingEvents: function (xml) {
      var vastTrackingEvents = [];

      var trackings = xml.getElementsByTagName(VASTElement.TRACKING);
      var trackingsLength = trackings.length;
      var vastTrackingEvent;
      var urlArray;
      var urlArrayLength;

      for (var i = 0; i < trackingsLength; i++) {
        vastTrackingEvent = new VASTTrackingEvent();
        urlArray = trackings[i].getElementsByTagName(this.URL);
        urlArrayLength = urlArray.length;
        for (var j = 0; j < urlArrayLength; j++) {
          vastTrackingEvent.urls.push(this.trim(xmlParser.textContent(urlArray[j])));
        }
        vastTrackingEvent.type = trackings[i].getAttribute(VASTElement.EVENT);
        vastTrackingEvents.push(vastTrackingEvent);
      }

      return vastTrackingEvents;
    },

    _parseCompanionsAds: function (xml) {
      var vastCompanionAds = [];
      var companions = xml[0].getElementsByTagName(VASTElement.COMPANION);
      var companionsLength = companions.length;
      var nodeArray = null;
      var nodeArrayLength;
      var vastCompanionAd;

      for (var i = 0; i < companionsLength; i++) {
        vastCompanionAd = new VASTCompanionAd();
        vastCompanionAd.id = companions[i].getAttribute(VASTElement.ID);
        vastCompanionAd.width = companions[i].getAttribute(VASTElement.WIDTH);
        vastCompanionAd.height = companions[i].getAttribute(VASTElement.HEIGHT);
        vastCompanionAd.expandedWidth = companions[i].getAttribute(VASTElement.EXPANDED_WIDTH);
        vastCompanionAd.expandedHeight = companions[i].getAttribute(VASTElement.EXPANDED_HEIGHT);

        var vastResourceType = new VASTResourceType();
        vastResourceType.name = companions[i].getAttribute(this.RESOURCE_TYPE).toLowerCase();
        vastCompanionAd.resourceType = vastResourceType;
        vastCompanionAd.creativeType = companions[i].getAttribute(VASTElement.CREATIVE_TYPE);

        nodeArray = companions[i].childNodes;
        nodeArrayLength = nodeArray.length;
        for (var j = 0; j < nodeArrayLength; j++) {
          if (nodeArray[j].nodeName == VASTElement.AD_PARAMETERS) {
            vastCompanionAd.adParameters = xmlParser.textContent(nodeArray[j]);
          } else if (nodeArray[j].nodeName == VASTElement.ALT_TEXT) {
            vastCompanionAd.altText = xmlParser.textContent(nodeArray[j]);
          } else if (nodeArray[j].nodeName == VASTElement.COMPANION_CLICK_THROUGH) {
            vastCompanionAd.clickThroughURL = this.trim(xmlParser.textContent(nodeArray[j]));
          } else if (nodeArray[j].nodeName == this.URL) {
            vastCompanionAd.url = this.trim(xmlParser.textContent(nodeArray[j]));
          } else if (nodeArray[j].nodeName == this.CODE) {
            vastCompanionAd.code = this.trim(xmlParser.textContent(nodeArray[j]));
          }
        }

        vastCompanionAds.push(vastCompanionAd);
      }

      return vastCompanionAds;
    },

    _parseNonLinearAds: function (xml) {
      return null; //NOT BE DONE IN v1
    },

    _parseWrapperTag: function (xml) {
      var vastWrapperAd = new VASTWrapperAd();

      var nodeArray = xml[0].childNodes;
      var nodeArrayLength = nodeArray.length;
      for (var i = 0; i < nodeArrayLength; i++) {
        if (nodeArray[i].nodeName == this.VAST_AD_TAG_URL) {
          vastWrapperAd.vastAdTagURL = this.trim(xmlParser.textContent(nodeArray[i]));
        } else if (nodeArray[i].nodeName == VASTElement.VIDEO_CLICKS) {
          vastWrapperAd.videoClicks = this._parseVideoClick(nodeArray[i]);
        } else if (nodeArray[i].nodeName == VASTElement.ERROR) {
          vastWrapperAd.error = this.trim(xmlParser.textContent(nodeArray[i]));
        } else if (nodeArray[i].nodeName == VASTElement.TRACKING_EVENTS) {
          vastWrapperAd.trackingEvents = this._parseTrackingEvents(nodeArray[i]);
        }
      }

      vastWrapperAd.impressions = this._parseImpressions(xml[0].getElementsByTagName(VASTElement.IMPRESSION));

      return vastWrapperAd;
    },

    _parseURLTags: function (xml) {
      var urls = [];

      var nodeArray = xml.childNodes;
      var nodeArrayLength = nodeArray.length;
      for (var i = 0; i < nodeArrayLength; i++) {
        if (nodeArray[i].nodeName == this.URL) {
          urls.push(this.trim(xmlParser.textContent(nodeArray[i])));
        }
      }

      return urls;
    }
  });

  return vast1parser;
});
