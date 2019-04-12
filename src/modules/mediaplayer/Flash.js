var i18n = require( 'sdk/base/util/I18n' );
var Platform = require( 'sdk/base/util/Platform' );

define( [
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/dom',
	'sdk/modules/base/ErrorCode',
	'./base/TechModule',
	'dojo/dom-construct'
], function ( declare, lang, dom, errorCode, techModule, domConstruct ) {

	var module = declare( [ techModule ], {

		// summary:
		//        A module for MediaPlayer that utilizes a Flash SWF for handling Flash SWF Controller (stream playback, vast ads, etc).
		//        Mobile and tablets will use the HTML5 module.
		//
		// description:
		//        All properties and methods listed here are specific to the Flash plugin only.

		/**
		 * Events sent by Flash object: the key NAME is the function called by flash on window, the key VALUE is the associated event name to emit
		 * onAdBreakDurationReached is not listened, this is done in another Module in JavaScript. This callback from flash is not removed in flash api for retro-compatibility.
		 *
		 * Dev note: if the key VALUE starts with the character underscore '_func' then the function in this class will be called instead of dispatching the event directly. (cf. this._onStreamStatus)
		 *
		 * @ignore
		 * */
		eventMap: {
			onPlayerReady: 'tech-ready',
			onStreamStarted: 'stream-start',
			onStreamStopped: 'stream-stop',
			onStreamFailed: 'stream-fail',
			onStreamStatus: '_onStreamStatus',
			onTrackCuePoint: '_onTrackCuePoint',
			onSpeechCuePoint: '_onSpeechCuePoint',
			onCustomCuePoint: '_onCustomCuePoint',
			onTargetSpot: 'targetspot-cue-point',
			onAdBreak: '_onAdBreakCuePoint',
			onSeekFailed: 'seek-fail',
			onSeekInvalidTime: 'seek-invalid-time',
			onTimeShiftPlaybackModeChanged: 'time-shift-playback-mode-change',
			onTimeShiftStreamStart: 'time-shift-stream-start',
			onTimeShiftPlayheadUpdate: 'time-shift-playhead-update',
			onAdPlaybackStart: 'ad-playback-start',
			onAdPlaybackComplete: 'ad-playback-complete',
			onAdPlaybackError: '_onAdPlaybackError',
			onAdPlaybackSkippableState: 'ad-playback-skippable-state',
			onAdCountdown: 'ad-countdown',
			onAdQuartile: 'ad-quartile',
			onVastProcessComplete: 'vast-process-complete',
			onVastCompanionsReady: 'vast-companions-ready',
			onConfigurationError: 'configuration-error',
			onVideoMidRollPlaybackStart: 'video-mid-roll-playback-start',
			onVideoMidRollPlaybackComplete: 'video-mid-roll-playback-complete',
			onVpaidAdCompanions: 'vpaid-ad-companions',
			onMediaLoadingStatus: 'media-loading-status', //FIXME i18n.getLocalization
			onMediaPlaybackStatus: '_onMediaPlaybackStatus',
			onMediaPlaybackTimeUpdate: 'media-playback-timeupdate',
			onMediaPlaybackMetadata: 'media-playback-metadata',
			onMediaError: '_onMediaError'
		},

		/**
		 * Convert flash stream status code to dojo i18n localized messages
		 *
		 * @ignore
		 */
		statusMap: {
			LIVE_PAUSE: 'paused',
			LIVE_PLAYING: 'onAir',
			LIVE_STOP: 'disconnected',
			LIVE_FAILED: 'streamUnavailable',
			LIVE_BUFFERING: 'buffering',
			LIVE_CONNECTING: 'connecting',
			LIVE_RECONNECTING: 'reconnecting',
			MEDIA_TIME_UPDATE: 'timeupdate',
			MEDIA_SEEK_FAILED: 'seekfailed',
			MEDIA_SEEK_INVALID_TIME: 'seekinvalidtime',
			MEDIA_ENDED: 'ended',
			MEDIA_PAUSED: 'pause',
			MEDIA_STARTED: 'play',
			MEDIA_STOPPED: 'stop',
			MEDIA_RESUMED: 'play',
			MEDIA_SEEKED: 'play',
			MEDIA_BUFFERING: 'buffering'
		},

		/**
		 * The minimum Flash version required
		 * @ignore
		 */
		minimumVersionRequired: {
			major: 10,
			minor: 2,
			rev: 0
		},

		CDN_URL: 'sdk.listenlive.co',

		constructor: function ( config, target, type ) {
			console.log( 'flash::constructor - playerId:' + config.playerId );

			this.errorCode = new errorCode();
			
			this.config.platformId = ( this.config.platformId != undefined && this.config.platformId != ''  ) ? this.config.platformId : 'prod01'; //prod01 by default
			var platform = new Platform( this.config.platformId );

			this.config.moduleDir = platform.endpoint.coreModuleDir;

			this._isAdBreak = false;

			this.inherited( arguments );
		},

		/*************************
		 *       Public Events     *
		 *************************/

		start: function () {
			if ( !this.isMinimalRequiredVersion( this.minimumVersionRequired.major, this.minimumVersionRequired.minor, this.minimumVersionRequired.rev ) ) {
				this._onError( this.errorCode.flashModuleMap[ 'flashPluginOutOfDate' ] );
				return;
			}

			this.inherited( arguments );

			// swfPath:String
			//        Path to SWF. Can be overwritten in the config.
			this.swfPath = this.config.tdPlayerPath || this._getApiSwfUrl();

			this._embedFlash();
		},

		_getApiSwfUrl: function () {
			var swfBaseUrl = this.CDN_URL; //prod01 by default		
			return '//' + swfBaseUrl + '/tdplayerapi/swf/tdplayer-api-6.0.swf';
		},

		_onReady: function () {
			console.log( 'flash::_onReady' );

			// summary:
			//        Stub - Fired when embedFlash has created the
			//        Flash object, but it has not necessarilly finished
			//        downloading, and is ready to be communicated with.
		},

		_onError: function ( error ) {
			console.error( 'flash::_onError - code : ' + error.code + ', message : ' + error.message );

			this.emit( 'tech-error', {
				error: error
			} );
		},

		/*************************
		 *       Public Methods     *
		 *************************/

		prepare: function ( params ) {
			this.inherited( arguments );
		},

		playStream: function ( params ) {
			this.inherited( arguments );

			console.log( 'flash::playStream - will play streamUrl:' + params.url );

			if ( typeof this.flashMovie.tdPlayer_playStream == 'function' )
				this.flashMovie.tdPlayer_playStream( params );
		},

		pauseStream: function () {
			this.inherited( arguments );

			this.flashMovie.tdPlayer_pauseStream();
		},

		stopStream: function () {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_stopStream == 'function' )
				this.flashMovie.tdPlayer_stopStream();

		},

		resumeStream: function () {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_resumeStream == 'function' )
				this.flashMovie.tdPlayer_resumeStream();
		},

		seekStream: function ( seekOffset ) {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_seekStream == 'function' )
				this.flashMovie.tdPlayer_seekStream( seekOffset );
		},

		seekLive: function () {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_seekLive == 'function' )
				this.flashMovie.tdPlayer_seekLive();
		},

		setVolume: function ( volumePercent ) {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_setVolume == 'function' )
				this.flashMovie.tdPlayer_setVolume( volumePercent );
		},

		mute: function () {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_mute == 'function' )
				this.flashMovie.tdPlayer_mute();
		},

		unMute: function () {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_unMute == 'function' )
				this.flashMovie.tdPlayer_unMute();
		},

		playAd: function ( adServerType, config ) {
			this.inherited( arguments );

			config.companionAdSelectionSettings = this.config.companionAdSelectionSettings; //IMA SDK settings object

			if ( typeof this.flashMovie.tdPlayer_playAd == 'function' )
				this.flashMovie.tdPlayer_playAd( adServerType, config );
		},

		skipAd: function () {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_skipAd == 'function' )
				this.flashMovie.tdPlayer_skipAd();
		},

		destroyAd: function ( shouldRemoveAdsRef ) {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_destroyAd == 'function' )
				this.flashMovie.tdPlayer_destroyAd();

			if ( shouldRemoveAdsRef != false ) {
				this.emit( 'ad-playback-destroy' );
			}
		},

		playMedia: function ( params ) {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_playMedia == 'function' )
				this.flashMovie.tdPlayer_playMedia( {
					url: params.url,
					autoStart: true
				} );
		},

		pauseMedia: function () {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_pauseMedia == 'function' )
				this.flashMovie.tdPlayer_pauseMedia();
		},

		resumeMedia: function () {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_resumeMedia == 'function' )
				this.flashMovie.tdPlayer_resumeMedia();
		},

		stopMedia: function () {
			this.inherited( arguments );

			if ( typeof this.flashMovie.tdPlayer_stopMedia == 'function' )
				this.flashMovie.tdPlayer_stopMedia();
		},

		seekMedia: function ( seekOffset ) {
			this.inherited( arguments );

			if ( seekOffset == 0 ) seekOffset = 0.001; //FIXME: BECAUSE SEEK TO 0 RESULTS TO INVALID SEEK TIME

			if ( typeof this.flashMovie.tdPlayer_seekMedia == 'function' )
				this.flashMovie.tdPlayer_seekMedia( seekOffset );
		},

		/*************************
		 *       Private Methods     *
		 *************************/

		_onStreamStatus: function ( data ) {
			console.log( 'flash::_onStreamStatus - code:' + data.code + ', status:' + data.status );

			var targetNode = dom.byId( data.id, document );
			if ( targetNode ) {
				var statusMessages = i18n.getLocalization();

				var msg = this.statusMap[ data.code ];
				if ( msg && statusMessages[ msg ] )
					data.status = statusMessages[ msg ];

				this.emit( 'stream-status', data, targetNode );
			} else {
				console.log( 'flash::Cannot fire the event:stream-status' );
			}
		},

		_onMediaPlaybackStatus: function ( data ) {
			console.log( 'flash::_onMediaPlaybackStatus - code:' + data.code + ', status:' + data.status );

			var targetNode = dom.byId( data.id, document );
			if ( targetNode ) {
				var statusMessages = i18n.getLocalization();

				var msg = this.statusMap[ data.code ];
				if ( msg && statusMessages[ msg ] )
					data.status = statusMessages[ msg ];

				if ( data.code === 'MEDIA_STARTED' ) {
					this.emit( 'media-playback-started' );
				}
				this.emit( 'media-playback-status', data, targetNode );
			} else {
				console.log( 'flash::Cannot fire the event:stream-status' );
			}
		},

		_onMediaError: function ( data ) {
			console.log( 'flash::_onMediaError:' + data.error );

			var targetNode = dom.byId( data.id, document );
			if ( targetNode ) {
				var statusMessages = i18n.getLocalization();

				if ( statusMessages[ 'error' ] )
					data.error = statusMessages[ 'error' ];

				this.emit( 'media-playback-error', data, targetNode );
			} else {
				console.log( 'flash::Cannot fire the event:media-error' );
			}
		},

		_onTrackCuePoint: function ( data ) {
			console.log( 'flash::_onTrackCuePoint' );

			if ( data.cuePoint && this.connection.mount ) {
				data.cuePoint.mount = this.connection.mount;
			}

			this.emit( 'track-cue-point', data );
		},

		_onSpeechCuePoint: function ( data ) {
			console.log( 'flash::_onSpeechCuePoint' );

			if ( data.cuePoint ) {
				data.cuePoint.mount = this.connection.mount;
			}

			this.emit( 'speech-cue-point', data );
		},

		_onCustomCuePoint: function ( data ) {
			console.log( 'flash::_onCustomCuePoint' );

			if ( data.cuePoint ) {
				data.cuePoint.mount = this.connection.mount;
			}

			this.emit( 'custom-cue-point', data );
		},

		_onAdBreakCuePoint: function ( data ) {
			console.log( 'flash::_onAdBreakCuePoint' );

			this._adBreak = ( data.adBreakData.isVastInStream ) ? true : false;

			this.emit( 'ad-break-cue-point', data );
		},

		_onAdPlaybackError: function ( data ) {
			console.log( 'flash::_onAdPlaybackError' );

			if ( !this._adBreak ) //IMPORTANT : ad-playback-error event is not emit if it's an AdBreak
			{
				this.emit( 'ad-playback-error', data );
			}
		},

		_tdPlayerEvents: function ( eventName, data ) {
			console.log( 'flash::tdPlayerEvents - eventName=' + eventName + ', data=' + data.id );
			console.log( data );

			var targetNode = dom.byId( data.id, document );

			//Call internal function
			if ( this.eventMap[ eventName ].substr( 0, 1 ) == '_' ) {
				var fn = lang.hitch( this, this.eventMap[ eventName ] );
				fn( data, eventName );
			} else if ( targetNode && this.eventMap[ eventName ] ) //Emit event
			{
				console.log( 'flash::event mapping:' + eventName + '/' + this.eventMap[ eventName ] + ' on target id:' + targetNode.id );
				this.emit( this.eventMap[ eventName ], data, targetNode );
			} else {
				console.log( 'flash::Cannot fire the event:' + eventName );
			}
		},

		_embedFlash: function () {
			// summary:
			//        Internal. Creates Flash TDPlayer

			console.log( 'flash::_embedFlash - id:' + this.playerNode.id );

			// Subscribing to published events coming from the Flash.
			// The flash div node id is available in data.id, so more than one player can be on a page and can have unique calls.
			window.tdPlayerEvents = lang.hitch( this, this._tdPlayerEvents );

			var statusMessages = i18n.getLocalization();

			//By default, directLiveStream plugin is activated
			var corePlugins = [ {
				'id': 'directLiveStream'
			} ];

			//TimeShift configuration. By default the max_listening_time is 30 minutes
			corePlugins[ 0 ].timeshift = ( this.config.timeShift ) ? {
				active: ( this.config.timeShift.active || 0 ),
				max_listening_time: ( this.config.timeShift.max_listening_time || 30 )
			} : {
				active: 0
			};

			if ( this.config.plugins != undefined && this.config.plugins.length > 0 )
				corePlugins = corePlugins.concat( this.config.plugins );

			var playerConfig = {
				playercore: {
					platform_id: this.config.platformId,
					plugins: corePlugins
				}
			};

			if ( this.config.moduleDir != null )
				playerConfig.playercore.module_dir = this.config.moduleDir;

			console.log( 'flash::_embedFlash - player config:' );

			//clean td_container div
			document.getElementById( this.config.playerId ).innerHTML = '';

			// create flash object
			var flashContentId = 'flash_content';
			domConstruct.create( 'div', {
				id: flashContentId
			}, document.getElementById( this.config.playerId ) );
			swfobject.embedSWF( this.swfPath,
				flashContentId,
				'100%',
				'100%',
				this.minimumVersionRequired.major + '.' + this.minimumVersionRequired.minor + '.' + this.minimumVersionRequired.rev,
				false, {
					isDebug: this.config.isDebug,
					config: encodeURIComponent( JSON.stringify( playerConfig ) ),
					id: this.playerNode.id
				}, {
					scale: 'showall',
					wmode: 'transparent',
					allowScriptAccess: 'always',
					allowNetworking: 'all',
					hasPriority: 'true'
				},
				false,
				lang.hitch( this, function ( e ) {
					console.log( e );
					if ( e.success ) {
						this.flashMovie = e.ref;
						this._onReady();
					} else {
						this._onError( {
							message: statusMessages[ 'embedFailed' ]
						} );
					}

				} )
			);

		},

		/**
		 * This will compare the actual running version to a minimum required version.
		 * Only the major version is required for the comparison, otherwise the other variables will be skipped.
		 *
		 * @param major compared to the majorVersion
		 * @param minor compared to the minorVersion
		 * @param rev compared to the revisionNumber
		 * @return {boolean}
		 *
		 */
		isMinimalRequiredVersion: function ( major, minor, rev ) {
			var version = swfobject.getFlashPlayerVersion();

			//console.log('The current flash plugin version is:' + version.major + '.' + version.minor + '.' + version.rev);
			//console.log('The minimum required version is:' + major + '.' + minor + '.' + rev);

			if ( major < version.major ) {
				return true;
			} else if ( major > version.major ) {
				return false;
			}

			if ( minor == 0 || minor < version.minor ) {
				return true;
			} else if ( minor > version.minor ) {
				return false;
			}

			if ( rev == 0 || rev < version.rev ) {
				return true;
			} else if ( rev > version.rev ) {
				return false;
			}

			return true;
		}

	} );

	return module;

} );
