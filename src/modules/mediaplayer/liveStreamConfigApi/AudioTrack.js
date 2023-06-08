function AudioTrack(data) {
  this.index = null;
  this.codec = null;
  this.bitRate = null;
  this.sampleRate = null;
  this.codec = null;
  this.channels = null;

  parse(this, data);

  function parse(context, data) {
    context.index = parseInt(data._attr.index._value);
    context.codec = data._attr.codec._value;
    context.bitRate = parseInt(data._attr.bitrate._value);

    context.sampleRate = parseInt(data._attr.samplerate._value);
    context.codec = data._attr.codec._value;
    context.channels = parseInt(data._attr.channels._value);

    context.isMP3 = context.codec.indexOf("mp3") !== -1;
    context.isAAC = context.codec.indexOf("aac") !== -1;
  }
}

module.exports = AudioTrack;
