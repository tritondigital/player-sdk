var _ = require('lodash');

var LocationHelper = require('sdk/base/util/LocationHelper');
var DEFAULT_PLATFORM = 'prod01';
var PROTOCOL = LocationHelper.getProtocol();

var ENDPOINT_MAP = {
  prod01: {
    liveStream: 'playerservices.streamtheworld.com/api/livestream',
    nowPlayingHistory: PROTOCOL + '//np.tritondigital.com/public/nowplaying',
    playerWebAdmin: PROTOCOL + '//pwav4.tritondigital.com/jsonconfig.php',
    coreModuleDir: PROTOCOL + '//sdk.listenlive.co/core/swf/',
    npe: PROTOCOL + '//npe2.listenlive.co/services/',
    see: PROTOCOL + '//see-p-elb-01.tritondigital.net/widget/{tenantId}/see.js',
    UA: 'G-QQRTXPJ64L'
  }
};

/**
 *
 * @param platformId
 * @returns {boolean}
 */
function platformExists(platformId) {
  var platformIds = _.keys(ENDPOINT_MAP);

  return platformId != undefined && platformIds.indexOf(platformId) > -1;
}

var Platform = (window.TdPlatform = function (platformId) {
  var existingPlatform = platformExists(platformId) ? platformId : DEFAULT_PLATFORM;
  this.endpoint = ENDPOINT_MAP[existingPlatform];
});

module.exports = Platform;
