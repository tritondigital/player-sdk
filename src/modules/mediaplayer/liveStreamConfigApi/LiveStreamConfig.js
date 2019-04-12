var _ = require( 'lodash' );
var Platform = require( 'sdk/base/util/Platform' );
var LiveStreamRepository = require( 'sdk/modules/mediaplayer/liveStreamConfigApi/LiveStreamRepository' );
var MountPoint = require( 'sdk/modules/mediaplayer/liveStreamConfigApi/MountPoint' );
var AudioPriority = require( 'sdk/modules/mediaplayer/liveStreamConfigApi/AudioPriority' );
var ArrayHelper = require( 'sdk/base/util/ArrayHelper' );
var LocationHelper = require( 'sdk/base/util/LocationHelper' );
var PROTOCOL =  LocationHelper.getProtocol();
/**
 * LiveStreamConfig
 */
function LiveStreamConfig( platformId, osPlatform, techType, configHls, configAudioAdaptive, forceHls, forceHlsts, playerServicesRegion ) {

	this.DEFAULT_TRANSPORTS = [ 'http', 'hls', 'hlsts' ];
	this.RTMP_TRANSPORTS = [ 'rtmpe', 'rtmpte', 'rtmp', 'rtmpt' ];
	this.mountPointsError = [];

	var platform = new Platform( platformId );
	var endPoint = (playerServicesRegion) ? PROTOCOL + "//" + playerServicesRegion + "-" + platform.endpoint.liveStream : 
					PROTOCOL + "//" + platform.endpoint.liveStream;
	var self = this;

	this.getStreamingConnections = function ( query, mountTags, excludeUntagged ) {

		var liveStreamRepository = new LiveStreamRepository( endPoint );

		return liveStreamRepository.getLiveStreamConfig( query )
			.then( function ( provisioningData ) {
				var mountpoints = ArrayHelper.toSafeArray( provisioningData.mountpoints.mountpoint ).filter( function ( mountPoint ) {

					if ( mountPoint.status[ 'status-code' ]._text >= 300 ) {

						self.mountPointsError.push( new MountPoint( mountPoint ) );
					}

					return mountPoint.status[ 'status-code' ]._text < 300;

				} ).map( function ( mountPoint ) {
					return new MountPoint( mountPoint );
				} );

				mountpoints = AudioPriority.filterMountPoints( mountpoints, osPlatform, techType, mountTags, excludeUntagged, !configHls, !configAudioAdaptive, forceHls, forceHlsts );
				return generateUrls( mountpoints, techType );

			} );

	}

	function generateUrls( mountpoints, techType ) {

		return _.flatMap( mountpoints, function ( mountpoint ) {
			return _.flatMap( mountpoint.servers, function ( server ) {

				return mountpoint.transports.map( function ( transport ) {
					var extension = getExtension( mountpoint );
					var mimeType = getMimeType( mountpoint );
					
					return {
						url: server + '/' + mountpoint.mount + ( transport.mountSuffix ? transport.mountSuffix : '' ) + ( techType.toLowerCase() === 'html5' ? extension : '' ),
						mount: mountpoint.mount,
						isGeoBlocked: mountpoint.status.isGeoBlocked,
						isAudioAdaptive: mountpoint.mediaFormat.isAudioAdaptive,
						alternateContent: mountpoint.alternateContent,
						mimeType: mimeType,
						format: mountpoint.format,
						uuidEnabled: _.some( mountpoint.metrics, function ( m ) {
							return m.name === 'uuid';
						} ),
						sendPageUrl: mountpoint.sendPageURL,
						hasVideo: mountpoint.mediaFormat.hasVideo,
						type: mountpoint.mediaFormat.type,
						metadata: mountpoint.metadata,
						tags: mountpoint.tags,
						mountpoint: mountpoint,
						isHLS: transport.transport ? ( transport.transport.toLowerCase() === 'hls' ) ? true : false : false,
						isHLSTS: transport.transport ? ( transport.transport.toLowerCase() === 'hlsts' ) ? true : false : false

					};
				} );
			} );

		} );

	}

	function getExtension( mountpoint ) {
		return mountpoint.mediaFormat.audioTracks[ 0 ].isMP3 ? '.mp3' : simpleAAC( mountpoint );
	}

	function simpleAAC( mountpoint ) {
		return ( mountpoint.mediaFormat.audioTracks[ 0 ].isAAC && !mountpoint.isAudioAdaptive && !mountpoint.hasHLS() && !mountpoint.hasHLSTS() ) ? '.aac' : '';
	}

	function getMimeType( mountpoint ) {
		var mimeType = null;

		if ( mountpoint.hasHLS() || mountpoint.mediaFormat.isAudioAdaptive ) {
			mimeType = 'application/x-mpegURL';
		} else if ( mountpoint.mediaFormat.audioTracks[ 0 ].isAAC ) {
			mimeType = 'audio/mp4';
		} else if ( mountpoint.mediaFormat.audioTracks[ 0 ].isMP3 ) {
			mimeType = 'audio/mpeg;codecs=mp3';
		}
		return mimeType;
	}

};

module.exports = LiveStreamConfig;