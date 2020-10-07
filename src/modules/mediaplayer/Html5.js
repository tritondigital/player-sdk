var params;

define( [
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/topic',
	'dojo/dom-construct',
	'sdk/modules/base/ErrorCode',
	'./base/TechModule',
	'sdk/base/cuepoints/HlsCuePoint',
	'sdk/base/cuepoints/BreakCuePoint',
	'sdk/modules/mediaplayer/html5/Html5Live',
	'sdk/modules/mediaplayer/html5/Html5OnDemand'
], function ( declare, lang, topic, domConstruct, errorCode, techModule, HlsCuePoint, BreakCuePoint, Html5Live, Html5OnDemand) {

	var module = declare( [ techModule ], {

		// summary:
		//        A module for MediaPlayer that utilizes a HTML5 for stream playback (audio/video tags)

		constructor: function ( config, target, type ) {
			console.log( 'html5::constructor - playerId:' + config.playerId );

			this.errorCode = new errorCode();

			this.playbackStatus = null;
			this.html5CheckerNode = null;
			this.target = target;

			this.inherited( arguments );
		},

		start: function () {
			if ( !this._isHTML5Supported() ) {
				this.emit( 'tech-error', {
					error: this.errorCode.html5ModuleMap[ 'browserNotSupported' ]
				} );
				return;
			}

			this.inherited( arguments );

			this.html5Live = new Html5Live( this.playerNode, this.config );
			this.html5Live.setPlaybackStatusHandler( lang.hitch( this, this._onPlaybackStatus ) );
			this.html5Live.setCuePointHandler( lang.hitch( this, this._onTrackCuePoint ) );
			this.html5Live.setAdBreakHandler( lang.hitch( this, this._onAdBreak ) );
			this.html5Live.setHlsCuePointHandler( lang.hitch( this, this._onHlsCuePoint ) );
			this.html5Live.setSpeechCuePointHandler( lang.hitch( this, this._onSpeechCuePoint ) );
			this.html5Live.setCustomCuePointHandler( lang.hitch( this, this._onCustomCuePoint ) );
			this.html5Live.setStreamStartHandler( lang.hitch( this, this._onStreamStart ) );
			this.html5Live.setStreamStopHandler( lang.hitch( this, this._onStreamStop ) );
			this.html5Live.setStreamFailedHandler( lang.hitch( this, this._onStreamFailed ) );
			this.html5OnDemand = new Html5OnDemand( this.playerNode );

			this._isMediaTagInitialized = false;

			this.emit( 'tech-ready', {
				id: this.playerNode
			} );
		},

		/*************************
		 *       Public Methods     *
		 *************************/

		prepare: function ( params ) {
			this.inherited( arguments );

			//HTML5 tags have to be create before LiveStreamApi call (xhr request) due to an iOS auto-play restriction
			this._initMediaTag();
		},

		playStream: function ( params ) {

			this.inherited( arguments );
			this.params = params;

			if ( !this._isMediaTagInitialized )
				this._initMediaTag();

			this.html5OnDemand.clean();

			this.html5Live.play( params );
		},

		pauseStream: function () {
			this.inherited( arguments );

			this.html5Live.pause();
		},

		stopStream: function () {
			this.inherited( arguments );
			this.html5Live.stop();
		},

		resumeStream: function () {
			this.inherited( arguments );

			this.html5Live.resume();
		},

		seekStream: function ( seekOffset ) {
			this.inherited( arguments );
		},

		seekLive: function () {
			this.inherited( arguments );
		},

		setVolume: function ( volumePercent ) {
			this.inherited( arguments );

			this.html5Live.setVolume( volumePercent );
			this.html5OnDemand.setVolume( volumePercent );
		},

		muteStream: function() {
			this.inherited( arguments );
			this.html5Live.mute();
		},

		muteMedia: function () {
			this.inherited( arguments );
			this.html5OnDemand.mute();
		},

		unMuteStream: function ( ) {
			this.inherited( arguments );
			this.html5Live.unMute(this.params);
		},

		unMuteMedia: function () {
			this.inherited( arguments );					
			this.html5OnDemand.unMute(this.params);				
		},

		playMedia: function ( params ) {
			this.inherited( arguments );
			if ( this.html5OnDemand == undefined ) return;

			if(params.url.indexOf('live.streamtheworld.com') >= 0 ){
				this.emit( 'tech-error', {
					error: this.errorCode.html5ModuleMap[ 'tritonListenLink' ]
				} );
			}else{
			this.playbackOnDemandStatushandler = this.html5OnDemand.setPlaybackStatusHandler( lang.hitch( this, this._onMediaPlaybackStatus ) );

			this.html5OnDemand.play( {
				mediaUrl: params.url,
				mediaFormat: 'audio'
			} );
			}
					
		},

		pauseMedia: function ( params ) {
			if ( this.html5OnDemand == undefined ) return;

			this.inherited( arguments );

			this.html5OnDemand.pause();
		},

		resumeMedia: function ( params ) {
			if ( this.html5OnDemand == undefined ) return;

			this.inherited( arguments );

			this.html5OnDemand.resume();
		},

		stopMedia: function ( params ) {
			if ( this.html5OnDemand == undefined ) return;

			this.inherited( arguments );

			this.html5OnDemand.stop();
		},

		seekMedia: function ( seekOffset ) {
			this.inherited( arguments );

			this.html5OnDemand.seek( seekOffset );
		},

		/*************************
		 *       Private Methods     *
		 *************************/

		/**
		 * Initialize HTML5 Live and onDemand media tag
		 */
		_initMediaTag: function () {
			this.html5OnDemand.initMediaTag();
			this._isMediaTagInitialized = true;
		},

		_onTrackCuePoint: function ( data ) {
			console.log( 'html5::_onTrackCuePoint' );
			console.log( this );

			if ( data.cuePoint && this.connection.mount ) {
				data.cuePoint.mount = this.connection.mount;
			}

			this.emit( 'track-cue-point', data );
		},

		_onSpeechCuePoint: function ( data ) {
			console.log( 'html5::_onSpeechCuePoint' );

			if ( data.cuePoint && this.connection.mount ) {
				data.cuePoint.mount = this.connection.mount;
			}

			this.emit( 'speech-cue-point', data );
		},

		_onCustomCuePoint: function ( data ) {
			console.log( 'html5::_onCustomCuePoint' );

			if ( data.cuePoint && this.connection.mount ) {
				data.cuePoint.mount = this.connection.mount;
			}

			this.emit( 'custom-cue-point', data );
		},

		_onHlsCuePoint: function ( data ) {
			console.log( 'html5::_onHlsCuePoint' );

			this.emit( 'hls-cue-point', data );

			if ( data.cuePoint && data.cuePoint.hlsTrackId ) {
				var audioTracks = this.connection.mountpoint.mediaFormat.audioTracks;

				if ( audioTracks &&
					audioTracks.length &&
					audioTracks.length >= data.cuePoint.hlsTrackId &&
					this._currentBitrate != audioTracks[ data.cuePoint.hlsTrackId ].bitRate ) {

					this._currentBitrate = audioTracks[ data.cuePoint.hlsTrackId ].bitRate;
					this.setCurrentTrack( audioTracks[ data.cuePoint.hlsTrackId ] ); //TechModule parent
					data.cuePoint.audioTrack = audioTracks[ data.cuePoint.hlsTrackId ];
					this.emit( 'stream-track-change', data );
				}
			}
		},

		_onAdBreak: function ( data ) {
			console.log( 'html5::_onAdBreak' );
			console.log( data );

			if ( data.cuePoint != undefined ) {
				data.adBreakData = {};
				data.adBreakData.adVast = ( data.cuePoint[ BreakCuePoint.AD_VAST ] != undefined && data.cuePoint[ BreakCuePoint.AD_VAST ] != '' ) ? data.cuePoint[ BreakCuePoint.AD_VAST ] : null;
				data.adBreakData.cueID = ( data.cuePoint[ BreakCuePoint.AD_ID ] != undefined && data.cuePoint[ BreakCuePoint.AD_ID ] != '' ) ? data.cuePoint[ BreakCuePoint.AD_ID ] : null;
				data.adBreakData.cueTitle = ( data.cuePoint[ BreakCuePoint.CUE_TITLE ] != undefined && data.cuePoint[ BreakCuePoint.CUE_TITLE ] != '' ) ? data.cuePoint[ BreakCuePoint.CUE_TITLE ] : null;
				data.adBreakData.duration = ( data.cuePoint[ BreakCuePoint.CUE_TIME_DURATION ] != undefined && data.cuePoint[ BreakCuePoint.CUE_TIME_DURATION ] != '' ) ? data.cuePoint[ BreakCuePoint.CUE_TIME_DURATION ] : null;
				data.adBreakData.isVastInStream = ( ( data.cuePoint[ BreakCuePoint.AD_VAST_URL ] != undefined && data.cuePoint[ BreakCuePoint.AD_VAST_URL ] != '' ) || ( data.cuePoint[ BreakCuePoint.AD_VAST ] && data.cuePoint[ BreakCuePoint.AD_VAST ] != '' ) ) ? true : false;
				data.adBreakData.url = ( data.cuePoint[ BreakCuePoint.AD_URL ] != undefined && data.cuePoint[ BreakCuePoint.AD_URL ] != '' ) ? data.cuePoint[ BreakCuePoint.AD_URL ] : null;
				data.adBreakData.vastUrl = ( data.cuePoint[ BreakCuePoint.AD_VAST_URL ] != undefined && data.cuePoint[ BreakCuePoint.AD_VAST_URL ] != '' ) ? data.cuePoint[ BreakCuePoint.AD_VAST_URL ] : null;
			}

			if ( data.adBreakData.isVastInStream == true && ( data.adBreakData.adVast || data.adBreakData.vastUrl ) ) {
				topic.publish( 'api/request', 'get-vast-instream', data.adBreakData );
			}

			this.emit( 'ad-break-cue-point', data );
		},

		_onPlaybackStatus: function ( e ) {
			console.log( e );

			if( this.playbackStatus == e.code ) return; //avoid emitting the same event twice

			this.playbackStatus = e.code;
			this.emit( 'stream-status', e );
		},

		_onMediaPlaybackStatus: function ( e ) {
			console.log( e );

			if ( e.type == 'Error' ) {
				this.emit( 'media-playback-error', {
					error: e.type,
					mediaElement: e.html5Node
				} );
				return;
			} else if ( e.type == 'timeupdate' ) {
				this.emit( 'media-playback-timeupdate', {
					status: e.type,
					code: e.code,
					duration: parseInt( e.html5Node.duration ),
					playedTime: parseInt( e.html5Node.currentTime ),
					remainingTime: parseInt( e.html5Node.duration - e.html5Node.currentTime ),
					percent: ( e.html5Node.currentTime / e.html5Node.duration ).toFixed( 2 )
				} );
				return;
			} else {
				this.emit( 'media-playback-status', {
					status: e.type,
					mediaElement: e.html5Node
				} );

				if ( e.type == 'play' ) {
					this.emit( 'media-playback-started' );
				}
			}

			if ( e.type == 'Ended' )
				this.html5OnDemand.stop();
		},

		_onMediaLoadingStatus: function ( e ) {
			this.emit( 'media-loading-status', {
				percent: e.percent,
				mediaElement: e.html5Node
			} );
		},

		_onStreamStart: function () {
			this._currentBitrate = null;

			this.setCurrentTrack( null );

			this.emit( 'stream-start' );
		},

		_onStreamStop: function () {
			this.setCurrentTrack( null );

			this.emit( 'stream-stop' );
		},

		_onStreamFailed: function () {
			this.setCurrentTrack( null );

			this.emit( 'stream-fail' );
		},

		_isHTML5Supported: function () {
			this.html5CheckerNode = domConstruct.create( 'audio', {
				id: 'testHtml5Node'
			}, this.playerNode, 'first' );
			var supported = !!this.html5CheckerNode.canPlayType;
			if ( this.html5CheckerNode != null )
				domConstruct.destroy( this.html5CheckerNode );
			return supported;
		}

	} );

	return module;

} );
