var _ = require( 'lodash' );

var ArrayHelper = require( 'sdk/base/util/ArrayHelper' );

var AudioTrack = require( 'sdk/modules/mediaplayer/liveStreamConfigApi/AudioTrack' );
var VideoTrack = require( 'sdk/modules/mediaplayer/liveStreamConfigApi/VideoTrack' );
var Const = require('sdk/base/util/Const');
var AUDIO_ADAPTIVE = 'audio-adaptive';

function MediaFormat( data ) {

	this.container = null;
	this.cuePoints = null;
	this.trackScheme = null;

	this.audioTracks = null;
	this.videoTracks = null;

	this.hasAudio = null;
	this.hasVideo = null;
	this.type = null;
	this.isAudioAdaptive = null;

	parse( this, data );

	function parse( context, data ) {

		context.container = data._attr.container._value;
		context.cuePoints = data._attr.cuepoints._value;
		context.trackScheme = data._attr.trackScheme._value;

		var audioTracksData = ArrayHelper.toSafeArray( data.audio );
		context.audioTracks = audioTracksData.map( function ( audioTrack ) {
			return new AudioTrack( audioTrack );
		} );

		var videoTracksData = ArrayHelper.toSafeArray( data.video );
		context.videoTracks = videoTracksData.map( function ( videoTrack ) {
			return new VideoTrack( videoTrack );
		} );

		context.isAudioAdaptive = context.trackScheme === AUDIO_ADAPTIVE;

		context.hasAudio = !_.isEmpty( context.audioTracks );
		context.hasVideo = !_.isEmpty( context.videoTracks );
		context.type = context.hasVideo ? Const.VIDEO : Const.AUDIO;
	}
}

module.exports = MediaFormat;
