var _ = require('lodash');

var ArrayHelper = require('sdk/base/util/ArrayHelper');

var AlternateContent = require('sdk/modules/mediaplayer/liveStreamConfigApi/AlternateContent');
var Status = require('sdk/modules/mediaplayer/liveStreamConfigApi/Status');
var Metrics = require('sdk/modules/mediaplayer/liveStreamConfigApi/Metrics');
var Tag = require('sdk/modules/mediaplayer/liveStreamConfigApi/Tag');
var Transport = require('sdk/modules/mediaplayer/liveStreamConfigApi/Transport');
var Metadata = require('sdk/modules/mediaplayer/liveStreamConfigApi/Metadata');
var Servers = require('sdk/modules/mediaplayer/liveStreamConfigApi/Servers');
var MediaFormat = require('sdk/modules/mediaplayer/liveStreamConfigApi/MediaFormat');
var MountPointHelper = require('sdk/modules/mediaplayer/liveStreamConfigApi/MountPointHelper');
/**
 * MountPoint
 */
function MountPoint(mountPointData) {
  MountPointHelper.call(this);

  parse(this, mountPointData);

  /**
   * Parse XML data
   *
   * @param {Element} data
   * @private
   */
  function parse(context, data) {
    context.alternateContent = data['alternate-content'] ? new AlternateContent(data['alternate-content']) : null;
    context.mount = data.mount._text || null;
    context.status = new Status(data.status);
    if (data.status['status-code']._text < 300) {
      context.tags =
        !data._attr || data._attr.tags || data._attr.tags._value === ''
          ? []
          : data._attr.tags._value.split(',').map(function (tag) {
              return new Tag(tag);
            });

      context.transports = ArrayHelper.toSafeArray(data.transports.transport).map(function (transport) {
        return new Transport(transport);
      });

      context.metadata = new Metadata(data.metadata);

      context.servers = new Servers(data.servers).servers;

      context.mediaFormat = new MediaFormat(data['media-format']);

      context.metrics = !data.metrics || _.isEmpty(data.metrics.tag) ? [] : new Metrics(data.metrics);

      context.format = data.format._text || null;

      context.bitRate = _.toSafeInteger(data.bitrate._text);

      context.authentication = data.authentication ? !!parseInt(data.authentication._text) : false;

      context.timeout = data.timeout ? _.toSafeInteger(data.timeout._text) : 0;

      context.sendPageURL = data['send-page-url'] ? !!parseInt(data['send-page-url']._text) : false;

      context.isAvailable = !context.status.isError && !context.status.isGeoBlocked && !_.isEmpty(context.servers);
    }
  }

  /**
   * Has tag ?
   *
   * @param {Tag} tag
   * @returns {boolean}
   */
  this.hasTag = function (tag) {
    return _.some(this.tags, function (item) {
      return item.name == tag;
    });
  };

  this.hasMetric = function (metric) {
    return _.some(this.metrics, function (item) {
      return item.name === metric;
    });
  };
}

module.exports = MountPoint;
