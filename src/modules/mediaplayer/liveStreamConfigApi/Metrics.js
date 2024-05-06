var ArrayHelper = require('sdk/base/util/ArrayHelper');
var Tag = require('sdk/modules/mediaplayer/liveStreamConfigApi/Tag');

function Metrics(data) {
  this.wcmStationId = null;
  this.listenerTrackingURL = null;
  this.tags = false;

  parse(this, data);

  function parse(context, data) {
    context.wcmStationId = data['listener-tracking'] ? data['listener-tracking']._attr['wcm-station-id']._value : 0;
    context.listenerTrackingURL = data['listener-tracking'] ? data['listener-tracking']._attr['url']._value : '';
    context.tags = ArrayHelper.toSafeArray(data.tag).map(function (metricTag) {
      return new Tag(metricTag);
    });
  }
}

module.exports = Metrics;
