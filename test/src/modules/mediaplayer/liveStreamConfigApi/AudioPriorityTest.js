var _ = require("lodash");
var expect = require("expect.js");
var AudioPriority = require("sdk/modules/mediaplayer/liveStreamConfigApi/AudioPriority");

var Platform = require("platform");
var MountPointHelper = require("sdk/modules/mediaplayer/liveStreamConfigApi/MountPointHelper");
var audioAdaptiveMountPoints = require("fixtures/AudioAdaptiveMountPoints");
var audioAdaptiveHLSTSMountPoints = require("fixtures/AudioAdaptiveHLSTSMountPoints");
var hlsMountPoints = require("fixtures/HLSESMountPoints");
var aacMountPoints = require("fixtures/AACMountPoints");
var hlstsMountPoints = require("fixtures/HLSTSMountPoints");
var hlstsOnlyMountPoints = require("fixtures/HLSTSOnlyMountPoints");
var mp3MountPoints = require("fixtures/MP3MountPoints");

var mountPointHelper = new MountPointHelper();
var hasHLS = mountPointHelper.hasHLS;
var hasHLSTS = mountPointHelper.hasHLSTS;

describe("AudioPriority", function () {
  var audioAdaptiveMountPoint, audioAdaptiveHighBitRateMountPoint;
  var audioAdaptiveHLSTSMountPoint, audioAdaptiveHLSTSHighBitRateMountPoint;
  var hlstsMountPoint, hlstsHighBitRateMountPoint;
  var hlsMountPoint, hlsHighBitRateMountPoint;
  var aacMountPoint, aacHighBitRateMountPoint;
  var mp3MountPoint, mp3HighBitRateMountPoint;
  var safariPlatform,
    iosPlatform,
    androidPlatform,
    chromePlatform,
    iePlatform,
    firefoxPlatform,
    iosChromePlatform,
    hlstsOnlyMountPoint,
    ie11Platform,
    ie11Windows7Platform,
    edgePlatform;

  beforeEach(function () {
    audioAdaptiveMountPoint = _.assign({}, audioAdaptiveMountPoints[0]);
    audioAdaptiveHighBitRateMountPoint = _.assign(
      {},
      audioAdaptiveMountPoints[1]
    );

    audioAdaptiveHLSTSMountPoint = _.assign(
      {},
      audioAdaptiveHLSTSMountPoints[0]
    );
    audioAdaptiveHLSTSHighBitRateMountPoint = _.assign(
      {},
      audioAdaptiveHLSTSMountPoints[1]
    );

    hlstsMountPoint = _.assign({}, hlstsMountPoints[0]);
    hlstsHighBitRateMountPoint = _.assign({}, hlstsMountPoints[1]);

    hlsMountPoint = _.assign({}, hlsMountPoints[0]);
    hlsHighBitRateMountPoint = _.assign({}, hlsMountPoints[1]);

    aacMountPoint = _.assign({}, aacMountPoints[0]);
    aacHighBitRateMountPoint = _.assign({}, aacMountPoints[1]);

    mp3MountPoint = _.assign({}, mp3MountPoints[0]);
    mp3HighBitRateMountPoint = _.assign({}, mp3MountPoints[1]);

    hlstsOnlyMountPoint = _.assign({}, hlstsOnlyMountPoints[0]);

    safariPlatform = Platform.parse(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2) AppleWebKit/534.51.22 (KHTML, like Gecko) Version/5.1.1 Safari/534.51.22"
    );

    iosPlatform = Platform.parse(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3"
    );

    iosChromePlatform = Platform.parse(
      "Mozilla/5.0 (iPhone; U; CPU iPhone OS 5_1_1 like Mac OS X; en) AppleWebKit/534.46.0 (KHTML, like Gecko) CriOS/19.0.1084.60 Mobile/9B206 Safari/7534.48.3"
    );

    androidPlatform = Platform.parse(
      "Mozilla/5.0 (Linux; Android 4.4; Nexus 5 Build/_BuildID_) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36"
    );

    chromePlatform = Platform.parse(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36"
    );

    iePlatform = Platform.parse(
      "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)"
    );

    ie11Platform = Platform.parse(
      "Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko"
    );

    ie11Windows7Platform = Platform.parse(
      "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko"
    );

    firefoxPlatform = Platform.parse(
      "Mozilla/5.0 (Windows NT x.y; Win64; x64; rv:10.0) Gecko/20100101 Firefox/10.0"
    );

    edgePlatform = Platform.parse(
      "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10136"
    );
  });

  describe("iOS", function () {
    it("should prioritize audio adaptive", function () {
      var mountPoints = [mp3MountPoint, hlsMountPoint, audioAdaptiveMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        iosPlatform,
        "html5",
        null,
        null
      );
      expect(mpts[0].mediaFormat.isAudioAdaptive).to.be(true);
    });

    it("should falback on HLS ES if no Audio Adaptive", function () {
      var mountPoints = [mp3MountPoint, hlsMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        iosPlatform,
        "html5",
        null,
        null
      );

      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
      expect(hasHLS(mpts[0])).to.be(true);
    });

    it("should falback on AAC if no Audio Adaptive and HLS ES", function () {
      var mountPoints = [mp3MountPoint, aacMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        iosPlatform,
        "html5",
        null,
        null
      );

      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
    });

    it("should falback on MP3 if nothing else is available", function () {
      var mountPoints = [hlstsOnlyMountPoint, mp3MountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        iosPlatform,
        "html5",
        null,
        null
      );
      expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
    });

    it("should not support HLS TS", function () {
      var mountPoints = [mp3MountPoint, hlstsOnlyMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        iosPlatform,
        "html5",
        null,
        null
      );
      expect(mpts).to.have.length(1);
    });

    describe("chrome", function () {
      it("should prioritize AAC ", function () {
        var mountPoints = [mp3MountPoint, aacMountPoint];
        var mpts = AudioPriority.filterMountPoints(
          mountPoints,
          iosChromePlatform,
          "html5",
          null,
          null,
          null,
          true
        );

        expect(mpts).to.have.length(2);
        expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
      });

      it("should support MP3", function () {
        var mountPoints = [mp3MountPoint];
        var mpts = AudioPriority.filterMountPoints(
          mountPoints,
          iosChromePlatform,
          "html5",
          null,
          null,
          null,
          true
        );

        expect(mpts).to.have.length(1);
        expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
      });
    });
  });

  describe("Android", function () {
    it("should prioritize Audio Adaptive HLS TS", function () {
      var mountPoints = [
        mp3MountPoint,
        hlstsMountPoint,
        audioAdaptiveHLSTSMountPoint,
      ];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        androidPlatform,
        "html5",
        null,
        null
      );

      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
      expect(mpts[0].mediaFormat.isAudioAdaptive).to.be(true);
      expect(hasHLSTS(mpts[0])).to.be(true);
    });

    it("should prioritize HLS TS", function () {
      var mountPoints = [mp3MountPoint, hlstsMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        androidPlatform,
        "html5",
        null,
        null
      );

      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
      expect(hasHLSTS(mpts[0])).to.be(true);
    });

    it("should support HLS ES", function () {
      var mountPoints = [mp3MountPoint, hlsMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        androidPlatform,
        "html5",
        null,
        null
      );

      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
    });

    it("should support AAC", function () {
      var mountPoints = [mp3MountPoint, aacMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        androidPlatform,
        "html5",
        null,
        null
      );

      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
    });
  });

  describe("web safari", function () {
    it("should not support Audio Adaptive", function () {
      var mountPoints = [audioAdaptiveMountPoint, mp3MountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        safariPlatform,
        "html5",
        null,
        null,
        null,
        true
      );

      expect(mpts).to.have.length(1);
      expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
    });

    it("should not support HLS TS", function () {
      var mountPoints = [hlstsOnlyMountPoint, mp3MountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        safariPlatform,
        "html5",
        null,
        null
      );

      expect(mpts).to.have.length(1);
      expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
    });

    it("should prioritize HLS ES", function () {
      var mountPoints = [mp3MountPoint, hlsMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        safariPlatform,
        "html5",
        null,
        null
      );

      expect(mpts).to.have.length(2);
      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
      expect(hasHLS(mpts[0])).to.be(true);
    });

    it("should support AAC", function () {
      var mountPoints = [mp3MountPoint, aacMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        safariPlatform,
        "html5",
        null,
        null
      );

      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
    });

    it("should falback on MP3 if nothing else is available", function () {
      var mountPoints = [
        audioAdaptiveMountPoint,
        hlstsOnlyMountPoint,
        mp3MountPoint,
      ];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        safariPlatform,
        "html5",
        null,
        null,
        null,
        true
      );

      expect(mpts).to.have.length(1);
      expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
    });
  });

  describe("chrome desktop", function () {
    it("should support MP3", function () {
      var mountPoints = [audioAdaptiveMountPoint, mp3MountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        chromePlatform,
        "html5",
        null,
        null,
        null,
        true
      );

      expect(mpts).to.have.length(1);
      expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
    });

    it("should support AAC", function () {
      var mountPoints = [
        audioAdaptiveMountPoint,
        hlsMountPoint,
        aacMountPoint,
        mp3MountPoint,
      ];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        chromePlatform,
        "html5",
        null,
        null,
        null,
        true
      );
      expect(mpts).to.have.length(3);
      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
    });
  });

  describe("firefox desktop", function () {
    it("should support MP3", function () {
      var mountPoints = [audioAdaptiveMountPoint, mp3MountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        firefoxPlatform,
        "html5",
        null,
        null,
        null,
        true
      );

      expect(mpts).to.have.length(1);
      expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
    });

    it("should support AAC", function () {
      var mountPoints = [
        audioAdaptiveMountPoint,
        hlsMountPoint,
        aacMountPoint,
        mp3MountPoint,
      ];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        firefoxPlatform,
        "html5",
        null,
        null,
        null,
        true
      );
      expect(mpts).to.have.length(3);
      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
    });
  });

  describe("internet explorer desktop", function () {
    it("should only support MP3 on < ie11", function () {
      var mountPoints = [
        audioAdaptiveMountPoint,
        hlsMountPoint,
        aacMountPoint,
        mp3MountPoint,
      ];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        iePlatform,
        "html5",
        null,
        null
      );

      expect(mpts).to.have.length(1);
      expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
    });

    it("should prioritize HLS on ie11", function () {
      var mountPoints = [
        audioAdaptiveMountPoint,
        hlsMountPoint,
        aacMountPoint,
        mp3MountPoint,
      ];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        ie11Platform,
        "html5",
        null,
        null,
        false,
        true
      );

      expect(mpts).to.have.length(2);
      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
      expect(hasHLS(mpts[0])).to.be(true);
    });

    it("should not support HLS on ie11 windows 7", function () {
      var mountPoints = [
        audioAdaptiveMountPoint,
        hlsMountPoint,
        aacMountPoint,
        mp3MountPoint,
      ];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        ie11Windows7Platform,
        "html5",
        null,
        null
      );

      expect(mpts).to.have.length(1);
      expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
    });
  });

  describe("Edge desktop", function () {
    it("should support MP3", function () {
      var mountPoints = [hlstsOnlyMountPoint, mp3MountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        edgePlatform,
        "html5",
        null,
        null,
        false,
        true
      );

      expect(mpts).to.have.length(1);
      expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
    });

    it("should support AAC", function () {
      var mountPoints = [
        audioAdaptiveMountPoint,
        hlsMountPoint,
        aacMountPoint,
        mp3MountPoint,
      ];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        edgePlatform,
        "html5",
        null,
        null
      );
      expect(mpts).to.have.length(4);
      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
    });

    it("should prioritize audio adaptive", function () {
      var mountPoints = [mp3MountPoint, hlsMountPoint, audioAdaptiveMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        edgePlatform,
        "html5",
        null,
        null
      );
      expect(mpts[0].mediaFormat.isAudioAdaptive).to.be(true);
    });

    it("should falback on HLS ES if no Audio Adaptive", function () {
      var mountPoints = [mp3MountPoint, hlsMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        edgePlatform,
        "html5",
        null,
        null
      );

      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
      expect(hasHLS(mpts[0])).to.be(true);
    });

    it("should not support HLS TS", function () {
      var mountPoints = [hlstsOnlyMountPoint, mp3MountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        edgePlatform,
        "html5",
        null,
        null
      );

      expect(mpts).to.have.length(1);
      expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
    });

    it("should prioritize HLS when we force it even on a unsupported browser", function () {
      var mountPoints = [mp3MountPoint, hlsMountPoint, audioAdaptiveMountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        edgePlatform,
        "html5",
        null,
        null,
        null,
        null,
        true
      );
      expect(hasHLS(mpts[0])).to.be(true);
      expect(mpts.length).to.be(2);
    });
  });

  describe("flash", function () {
    it("should prioritize AAC", function () {
      var mountPoints = [audioAdaptiveMountPoint, hlsMountPoint, mp3MountPoint];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        chromePlatform,
        "flash",
        null,
        null
      );

      expect(mpts[0].mediaFormat.audioTracks[0].isAAC).to.be(true);
      expect(hasHLS(mpts[0])).to.be(false);
    });

    it("should fallback on MP3 if nothing else is available", function () {
      var mountPoints = [
        audioAdaptiveMountPoint,
        hlstsOnlyMountPoint,
        mp3MountPoint,
      ];
      var mpts = AudioPriority.filterMountPoints(
        mountPoints,
        chromePlatform,
        "flash",
        null,
        null
      );

      expect(mpts[0].transports).to.have.length(1);
      expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
    });
  });

  it("should remove HLS mounts if config disable it", function () {
    var mountPoints = [hlsMountPoint, mp3MountPoint];
    var mpts = AudioPriority.filterMountPoints(
      mountPoints,
      safariPlatform,
      "html5",
      null,
      null,
      true,
      false
    );

    expect(mpts[0].transports).to.have.length(1);
    expect(mpts[0].transports[0].transport).to.be("http");
  });

  it("should remove Audio Adaptive mounts if config disable it", function () {
    var mountPoints = [audioAdaptiveMountPoint, mp3MountPoint];
    var mpts = AudioPriority.filterMountPoints(
      mountPoints,
      safariPlatform,
      "html5",
      null,
      null,
      false,
      true
    );

    expect(mpts[0].transports).to.have.length(1);
    expect(mpts[0].mediaFormat.audioTracks[0].isMP3).to.be(true);
  });

  it("should order audio adaptive mounts by bitrate", function () {
    var mountPoints = [
      audioAdaptiveMountPoint,
      audioAdaptiveHighBitRateMountPoint,
    ];
    var mpts = AudioPriority.filterMountPoints(
      mountPoints,
      iosPlatform,
      "html5",
      null,
      null
    );

    expect(mpts[0].bitRate).to.be(128000);
    expect(mpts[1].bitRate).to.be(80000);
  });

  it("should order audio adaptive mounts by bitrate", function () {
    var mountPoints = [
      audioAdaptiveHLSTSMountPoint,
      audioAdaptiveHLSTSHighBitRateMountPoint,
    ];
    var mpts = AudioPriority.filterMountPoints(
      mountPoints,
      androidPlatform,
      "html5",
      null,
      null
    );

    expect(mpts[0].bitRate).to.be(128000);
    expect(mpts[1].bitRate).to.be(80000);
  });

  it("should order HLS TS mounts by bitrate", function () {
    var mountPoints = [hlstsMountPoint, hlstsHighBitRateMountPoint];
    var mpts = AudioPriority.filterMountPoints(
      mountPoints,
      androidPlatform,
      "html5",
      null,
      null
    );

    expect(mpts[0].bitRate).to.be(128000);
    expect(mpts[1].bitRate).to.be(80000);
  });

  it("should order HLS ES mounts by bitrate", function () {
    var mountPoints = [hlsMountPoint, hlsHighBitRateMountPoint];
    var mpts = AudioPriority.filterMountPoints(
      mountPoints,
      iosPlatform,
      "html5",
      null,
      null
    );

    expect(mpts[0].bitRate).to.be(128000);
    expect(mpts[1].bitRate).to.be(80000);
  });

  it("should order AAC mounts by bitrate", function () {
    var mountPoints = [aacMountPoint, aacHighBitRateMountPoint];
    var mpts = AudioPriority.filterMountPoints(
      mountPoints,
      iosPlatform,
      "html5",
      null,
      null
    );

    expect(mpts[0].bitRate).to.be(128000);
    expect(mpts[1].bitRate).to.be(80000);
  });

  it("should order all mounts by bitrate and codec", function () {
    var mountPoints = [
      mp3HighBitRateMountPoint,
      aacMountPoint,
      aacHighBitRateMountPoint,
      audioAdaptiveMountPoint,
    ];
    var mpts = AudioPriority.filterMountPoints(
      mountPoints,
      iosPlatform,
      "html5",
      null,
      null
    );

    expect(mpts[0].bitRate).to.be(80000);
    expect(mpts[0].mediaFormat.isAudioAdaptive).to.be(true);
    expect(mpts[1].mediaFormat.audioTracks[0].isAAC).to.be(true);
    expect(mpts[1].bitRate).to.be(128000);
    expect(mpts[2].mediaFormat.audioTracks[0].isAAC).to.be(true);
    expect(mpts[2].bitRate).to.be(80000);
    expect(mpts[3].mediaFormat.audioTracks[0].isMP3).to.be(true);
  });

  it("should order MP3 mounts by bitrate", function () {
    var mountPoints = [mp3MountPoint, mp3HighBitRateMountPoint];
    var mpts = AudioPriority.filterMountPoints(
      mountPoints,
      androidPlatform,
      "html5",
      null,
      null
    );

    expect(mpts[0].bitRate).to.be(128000);
    expect(mpts[1].bitRate).to.be(80000);
  });

  it("should return only tagged mount points", function () {
    var mountPoints = [audioAdaptiveMountPoint, hlsMountPoint];

    var mountPointsByTag = AudioPriority.filterByTag(mountPoints, "low", true);
    expect(mountPointsByTag).to.have.length(1);
  });

  it("should return no mount points if all mountPoints are untagged and should be excluded", function () {
    var mountPoints = [hlsMountPoint];
    var mountPointsByTag = AudioPriority.filterByTag(mountPoints, [], true);

    expect(mountPointsByTag).to.have.length(0);
  });

  it("should return all mount points if they have a specified tag or are not excluded when untagged", function () {
    var mountPoints = [audioAdaptiveMountPoint, hlsMountPoint];

    var mountPointsByTag = AudioPriority.filterByTag(mountPoints, "low", false);
    expect(mountPointsByTag).to.have.length(2);
  });
});
