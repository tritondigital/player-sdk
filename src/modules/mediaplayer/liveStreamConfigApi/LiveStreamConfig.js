var _ = require('lodash');
var Platform = require('sdk/base/util/Platform');
var LiveStreamRepository = require('sdk/modules/mediaplayer/liveStreamConfigApi/LiveStreamRepository');
var MountPoint = require('sdk/modules/mediaplayer/liveStreamConfigApi/MountPoint');
var AudioPriority = require('sdk/modules/mediaplayer/liveStreamConfigApi/AudioPriority');
var ArrayHelper = require('sdk/base/util/ArrayHelper');
var LocationHelper = require('sdk/base/util/LocationHelper');
var PROTOCOL = LocationHelper.getProtocol();
/**
 * LiveStreamConfig
 */
function LiveStreamConfig(platformId, osPlatform, techType, configHls, configAudioAdaptive, forceHls, forceHlsts, playerServicesRegion) {
  this.DEFAULT_TRANSPORTS = ['http', 'hls'];
  this.TIMESHIFT_TRANSPORT = ['hls'];
  this.mountPointsError = [];

  var platform = new Platform(platformId);
  var endPoint = playerServicesRegion ? PROTOCOL + '//' + playerServicesRegion + '-' + platform.endpoint.liveStream : PROTOCOL + '//' + platform.endpoint.liveStream;
  var self = this;

  this.getStreamingConnections = function (query, mountTags, excludeUntagged, timeshift) {
    var liveStreamRepository = new LiveStreamRepository(endPoint);

    return liveStreamRepository.getLiveStreamConfig(query).then(function (provisioningData) {
      var mountpoints = ArrayHelper.toSafeArray(provisioningData.mountpoints.mountpoint)
        .filter(function (mountPoint) {
          if (mountPoint.status['status-code']._text >= 300) {
            self.mountPointsError.push(new MountPoint(mountPoint));
          }

          return mountPoint.status['status-code']._text < 300;
        })
        .map(function (mountPoint) {
          return new MountPoint(mountPoint);
        });

      mountpoints = AudioPriority.filterMountPoints(mountpoints, osPlatform, techType, mountTags, excludeUntagged, !configHls, !configAudioAdaptive, forceHls, forceHlsts, timeshift);
      return generateUrls(mountpoints, techType, timeshift, query.isProgram, query.programID);
    });
  };

  function generateUrls(mountpoints, techType, timeshift, isProgram, programID) {
    return _.flatMap(mountpoints, function (mountpoint) {
      if (timeshift) {
        mountpoint.transports = mountpoint.transports.filter(transport => {
          return transport.timeshift == true;
        });
      }
      return _.flatMap(mountpoint.servers, function (server) {
        return mountpoint.transports.map(function (transport) {
          var extension = getExtension(mountpoint);
          var mimeType = getMimeType(mountpoint);

          return {
            url: getUrl(timeshift, server, mountpoint, transport, techType, extension, isProgram, programID),
            mrHost: new URL(server).hostname,
            mount: mountpoint.mount,
            isGeoBlocked: mountpoint.status.isGeoBlocked,
            isAudioAdaptive: mountpoint.mediaFormat.isAudioAdaptive,
            alternateContent: mountpoint.alternateContent,
            mimeType: mimeType,
            format: mountpoint.format,
            uuidEnabled: _.some(mountpoint.metrics.tags, function (m) {
              return m.name === 'uuid';
            }),
            sendPageUrl: mountpoint.sendPageURL,
            hasVideo: mountpoint.mediaFormat.hasVideo,
            type: mountpoint.mediaFormat.type,
            metadata: mountpoint.metadata,
            tags: mountpoint.metrics.tags,
            wcmStationId: mountpoint.metrics.wcmStationId,
            listenerTrackingURL: mountpoint.metrics.listenerTrackingURL,
            mountpoint: mountpoint,
            isHLS: transport.transport ? (transport.transport.toLowerCase() === 'hls' || transport.transport.toLowerCase() === 'hlsrw' ? true : false) : false,
            isHLSTS: transport.transport ? (transport.transport.toLowerCase() === 'hlsts' ? true : false) : false,
            isTimeshift: transport.timeshift ? transport.timeshift : false
          };
        });
      });
    });
  }

  function getUrl(timeshift, server, mountpoint, transport, techType, extension, isProgram, programID) {
    if (isProgram) {
      return 'https://' + new URL(server).hostname + '/' + mountpoint.mount + '/CLOUD/HLS/program/' + programID + '/playlist.m3u8';
    } else {
      return timeshift
        ? server + '/' + mountpoint.mount + (transport.mountSuffix ? transport.mountSuffix : '')
        : server + '/' + mountpoint.mount + (transport.mountSuffix ? transport.mountSuffix : '') + (techType.toLowerCase() === 'html5' ? extension : '');
    }
  }

  function getExtension(mountpoint) {
    return mountpoint.mediaFormat.audioTracks[0].isMP3 ? '.mp3' : simpleAAC(mountpoint);
  }

  function simpleAAC(mountpoint) {
    return (mountpoint.mediaFormat.audioTracks[0].isAAC && !mountpoint.isAudioAdaptive && !mountpoint.hasHLS() && !mountpoint.hasHLSTS()) ||
      (mountpoint.mediaFormat.audioTracks[0].isAAC && !forceHls && !forceHlsts && osPlatform.os.family.toLowerCase() == 'android')
      ? '.aac'
      : '';
  }

  function getMimeType(mountpoint) {
    var mimeType = null;

    if (mountpoint.hasHLS() || mountpoint.mediaFormat.isAudioAdaptive) {
      mimeType = 'application/x-mpegURL';
    } else if (mountpoint.mediaFormat.audioTracks[0].isAAC) {
      mimeType = 'audio/mp4';
    } else if (mountpoint.mediaFormat.audioTracks[0].isMP3) {
      mimeType = 'audio/mpeg;codecs=mp3';
    }
    return mimeType;
  }
}

module.exports = LiveStreamConfig;
