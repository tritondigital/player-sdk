function VideoTrack(data) {
  this.index = null;
  this.codec = null;
  this.bitRate = null;

  this.frameRate = null;
  this.width = null;
  this.height = null;
  this.aspect = null;
  this.keyframeInterval = null;

  parse(this, data);

  function parse(context, data) {
    context.index = parseInt(data._attr.index._value);
    context.codec = data._attr.codec._value;
    context.bitRate = parseInt(data._attr.bitrate._value);

    context.frameRate = parseFloat(data._attr.framerate._value);
    context.width = parseInt(data._attr.width._value);
    context.height = parseInt(data._attr.height._value);
    context.aspect = parseFloat(data._attr.aspect._value);
    context.keyframeInterval = parseInt(data._attr["keyframe-interval"]._value);
  }
}

module.exports = VideoTrack;
