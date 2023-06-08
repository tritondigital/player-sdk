var expect = require("expect.js");
var Q = require("q");
var Platform = require("platform");
var ProvisioningData = require("fixtures/ProvisioningData");
var LiveStreamConfigInjector = require("injected!sdk/modules/mediaplayer/liveStreamConfigApi/LiveStreamConfig");
var AlternateContent = require("raw!fixtures/ForbiddenAccessWithAlternateContent.xml");
var xmlParser = require("sdk/base/util/XmlParser");

var alternateContentJson = xmlParser.xmlToJson(
  xmlParser.parse(AlternateContent).childNodes[0]
);

describe("LiveStreamConfig", function () {
  var liveStreamConfigParams;
  before(function () {
    liveStreamConfigParams = {
      station: "TRITONRADIOMUSIC",
      mount: null,
      transports: ["rtmpe,rtmpte,rtmp,rtmpt,http,hls,hlsts"],
      version: 1.8,
    };
  });

  it("should create urls from provisioning data", function () {
    var deferred = Q.defer();
    var LiveStreamRepositoryMock = function () {
      this.getLiveStreamConfig = function () {
        return {
          then: function (callback) {
            var urls = callback(ProvisioningData);
            deferred.resolve(urls);
            return deferred.promise;
          },
        };
      };
    };

    var LiveStreamConfig = LiveStreamConfigInjector({
      "sdk/modules/mediaplayer/liveStreamConfigApi/LiveStreamRepository":
        LiveStreamRepositoryMock,
    });

    var platformId = "prod01";
    var androidPlatform = Platform.parse(
      "Mozilla/5.0 (Linux; Android 4.4; Nexus 5 Build/_BuildID_) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36"
    );
    var techType = "Html5";
    var configHls = true;
    var configAudioAdaptive = false;
    var mountTags = [];
    var excludeUntagged = null;

    var liveStreamConfig = new LiveStreamConfig(
      platformId,
      androidPlatform,
      techType,
      configHls,
      configAudioAdaptive
    );
    liveStreamConfig
      .getStreamingConnections(
        liveStreamConfigParams,
        mountTags,
        excludeUntagged,
        false
      )
      .then(function (streamingConnections) {
        expect(streamingConnections.length).to.be(12);
      });
  });

  it("should play alternate content when access is forbidden", function (cb) {
    var deferred = Q.defer();
    var LiveStreamRepositoryMockAlternate = function () {
      this.getLiveStreamConfig = function () {
        return {
          then: function (callback) {
            var urls = callback(alternateContentJson);
            deferred.resolve(urls);
            return deferred.promise;
          },
        };
      };
    };

    var LiveStreamConfigAlternate = LiveStreamConfigInjector({
      "sdk/modules/mediaplayer/liveStreamConfigApi/LiveStreamRepository":
        LiveStreamRepositoryMockAlternate,
    });

    var platformId = "prod01";
    var androidPlatform = Platform.parse(
      "Mozilla/5.0 (Linux; Android 4.4; Nexus 5 Build/_BuildID_) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36"
    );
    var techType = "Html5";
    var configHls = true;
    var configAudioAdaptive = false;
    var mountTags = [];
    var excludeUntagged = null;

    var alternateMount =
      alternateContentJson.mountpoints.mountpoint["alternate-content"].mount
        ._text;

    var liveStreamConfigAlternate = new LiveStreamConfigAlternate(
      platformId,
      androidPlatform,
      techType,
      configHls,
      configAudioAdaptive
    );

    liveStreamConfigAlternate
      .getStreamingConnections(
        liveStreamConfigParams,
        mountTags,
        excludeUntagged,
        false
      )
      .then(function (streamingConnections) {
        expect(streamingConnections.length).to.be(0);
        expect(liveStreamConfigAlternate.mountPointsError.length).to.be(1);
        expect(
          liveStreamConfigAlternate.mountPointsError[0].alternateContent.mount
        ).to.be(alternateMount);
        expect(
          liveStreamConfigAlternate.mountPointsError[0].status.isGeoBlocked
        ).to.be(true);

        cb();
      });
  });
});
