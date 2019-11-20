/**
 * HTML5 Player
 *
 * @class Manage HTML5 player (audio / video):
 * - Play
 * - Stop
 * - Skip
 * - Pause
 * - Resume
 * - Seek
 * - Set Volume
 * - Mute / unmute
 * - Status
 */

var OsPlatform = require( 'platform' );
var Hls = require( 'hls.js' );
var PlaybackState = require( 'sdk/base/playback/PlaybackState' );
var MediaElement = require( 'sdk/base/util/MediaElement' );

define( [
	'dojo/_base/declare',
	'dojo/on',
	'dojo/Evented',
	'dojo/_base/array',
	'dojo/_base/lang',
	'dojo/dom-attr',
	'dojo/query',
	'dojo/has'
], function ( declare, on, Evented, array, lang, domAttr, query, has ) {

	var html5Player = declare( [ Evented ], {

		MAX_CONNECTION_LATENCY: 5000,

		constructor: function () {
			console.log( 'html5Player::constructor' );

			this.inherited( arguments );

			this.mediaNode = null;
			this.audioSource = null;
			this.isStopped = true;
			this.isPaused = true;

			this.listeners = [];

			this.volume = 1;

			//this._connectionLatencyTimerId = null;

			this._onCanPlayHandler = lang.hitch( this, this._onCanPlay );
			this._onCanPlayThroughHandler = lang.hitch( this, this._onCanPlayThrough );
			this._onLoadDataHandler = lang.hitch( this, this._onLoadData );
			this._onLoadStartHandler = lang.hitch( this, this._onLoadStart );
			this._onWaitingHandler = lang.hitch( this, this._onWaiting );
			this._onEmptiedHandler = lang.hitch( this, this._onEmptied );
			this._onAbortHandler = lang.hitch( this, this._onAbort );
			this._onErrorHandler = lang.hitch( this, this._onError );
			this._onLoadedMetadataHandler = lang.hitch( this, this._onLoadedmetadata );
			this._onTimeUpdateHandler = lang.hitch( this, this._onTimeupdate );
			this._onEndedHandler = lang.hitch( this, this._onEnded );
			this._onPlayHandler = lang.hitch( this, this._onPlay );
			this._onPauseHandler = lang.hitch( this, this._onPause );
			this._onProgressHandler = lang.hitch( this, this._onProgress );
			this._onStalledHandler = lang.hitch( this, this._onStalled );
			this._onSuspendHandler = lang.hitch( this, this._onSuspend );
		},

		/**
		 * Play a file (URL, stream or onDemand)
		 *
		 * @param url
		 * @param type (audio or video)
		 * @param mimeType
		 *
		 * @ignore
		 */
		play: function ( params ) {
			this.mediaNode = params.mediaNode;

			this.isStopped = false;
			this.isPaused = false;

			this._loadMedia( params );
			

		},

		/**
		 * Stop current playback
		 *
		 * pause() function is called
		 * src attribute is set to '' to stop downloading
		 *
		 * @ignore
		 */
		stop: function () {
			this.isStopped = true;
			this.isPaused = false;

			if ( this.mediaNode == undefined ) return;

			this.mediaNode.pause();
			this._emptyMediaNode();

			// if ( !has( 'ie11' ) ) {
			// 	this._removeMediaSource();
			// }
		},

		/**
		 * Skip current playback
		 *
		 * pause() function is called
		 * src attribute is set to '' to stop downloading
		 *
		 * @ignore
		 */
		skip: function () {
			this.isStopped = true;
			this.isPaused = false;

			if ( this.mediaNode == undefined ) return;

			this.emit( 'html5-playback-status', {
				type: PlaybackState.ENDED
			} );

			this.mediaNode.pause();
		},

		/**
		 * Pause current playback
		 *
		 * file continue to download
		 *
		 * @ignore
		 */
		pause: function () {
			this.isPaused = true;

			if ( this.mediaNode == undefined ) return;

			this.mediaNode.pause();
		},

		/**
		 * Resume current playback
		 *
		 * @ignore
		 */
		resume: function () {
			var context = this;
			this.isPaused = false;

			if ( this.mediaNode == undefined ) return;

			if ( this.mediaNode.paused )
				this.mediaNode.play().catch(function(e){
					if ( e.name === 'NotAllowedError' ) {
						context.emit( 'html5-playback-status', {
							type: PlaybackState.PLAY_NOT_ALLOWED,
							mediaNode: this.audioNode
						} );
					}
				});
		},

		/**
		 * Seek current playback to seekOffset
		 *
		 * @ignore
		 */
		seek: function ( seekOffset ) {
			if ( this.mediaNode == undefined ) return;

			this.mediaNode.currentTime = seekOffset;

			if ( this.isPaused )
				this.resume();
		},

		/**
		 * Set Volume
		 *
		 * @param volumePercent
		 *
		 * @ignore
		 */
		setVolume: function ( volumePercent ) {
			if ( this.mediaNode == undefined ) return;

			console.log( 'volumePercent = ' + volumePercent );

			this.volume = volumePercent;
			this.mediaNode.volume = volumePercent;
		},

		/**
		 * Mute
		 *
		 * @ignore
		 */
		mute: function () {
			if ( this.mediaNode == undefined ) return;

			console.log( 'volumePercent = ' + this.volume );

			this.mediaNode.volume = 0;
			this.mediaNode.muted = true;
		},

		/**
		 * Unmute
		 *
		 * @ignore
		 */
		unMute: function () {
			if ( this.mediaNode == undefined ) return;

			console.log( 'volumePercent = ' + this.volume );

			this.mediaNode.volume = this.volume;
			this.mediaNode.muted = false;
		},

		/***************************************/
		/******* PRIVATE FUNCTIONS  ************/
		/***************************************/

		_loadMedia: function ( params ) {

			this.mediaNode.src = params.url;
			this._initMediaListeners( params.isLive );

			this.mediaNode.load();

		},

		_emptyMediaNode: function () {
			// domAttr.set( this.audioSource, 'src', '' );
			// domAttr.set( this.mediaNode, 'src', '' );
			this.mediaNode.src = '';
		},

		_removeMediaSource: function () {
			if ( domAttr.has( this.audioSource, 'src' ) ) {
				domAttr.remove( this.audioSource, 'src' );
			}

			if ( domAttr.has( this.mediaNode, 'src' ) ) {
				domAttr.remove( this.mediaNode, 'src' );
			}
		},

		_onLoadData: function () {
			var context = this;
			if ( this.isStopped || this.isPaused ) return;

			/* HACK: Firefox does not support canPlayThrough/canPlay event */
			if ( has( 'mozilla' ) && this.mediaNode && this.mediaNode.paused ) {
				this.mediaNode.play().catch(function(e){
					if ( e.name === 'NotAllowedError' ) {
						context.emit( 'html5-playback-status', {
							type: PlaybackState.PLAY_NOT_ALLOWED,
							mediaNode: this.audioNode
						} );
					}
				});
			}

			this.emit( 'html5-playback-status', {
				type: PlaybackState.DATA_LOADING,
				mediaNode: this.mediaNode
			} ); //The user agent can render the media data at the current playback position for the first time.
		},

		_onCanPlay: function () {
			var context = this;
			if ( this.isStopped || this.isPaused ) return;

			this.emit( 'html5-playback-status', {
				type: PlaybackState.CAN_PLAY,
				mediaNode: this.mediaNode
			} ); //The user agent can resume playback of the media data, but estimates that if playback were to be started now, the media resource could not be rendered at the current playback rate up to its end without having to stop for further buffering of content.

			if ( this.mediaNode && this.mediaNode.paused ) {
				this.mediaNode.play().catch(function(e){
					if ( e.name === 'NotAllowedError' ) {
						context.emit( 'html5-playback-status', {
							type: PlaybackState.PLAY_NOT_ALLOWED,
							mediaNode: this.audioNode
						} );
					}
				});
			}
		},

		_onCanPlayThrough: function () {
			var context = this;
			if ( this.isStopped || this.isPaused ) return;

			this.emit( 'html5-playback-status', {
				type: PlaybackState.CAN_PLAY_THROUGH,
				mediaNode: this.mediaNode
			} ); //The user agent estimates that if playback were to be started now, the media resource could be rendered at the current playback rate all the way to its end without having to stop for further buffering.

			if ( this.mediaNode && this.mediaNode.paused ) {
				this.mediaNode.play().catch(function(e){
					if ( e.name === 'NotAllowedError' ) {
						context.emit( 'html5-playback-status', {
							type: PlaybackState.PLAY_NOT_ALLOWED,
							mediaNode: this.audioNode
						} );
					}
				});
			}
		},

		_onWaiting: function () {
			if ( this.isStopped || this.isPaused ) return;

			this.emit( 'html5-playback-status', {
				type: PlaybackState.WAITING,
				mediaNode: this.mediaNode
			} ); //Playback has stopped because the next frame is not available, but the user agent expects that frame to become available in due course.
		},

		_onEmptied: function () {
			if ( this.isStopped || this.isPaused ) return;

			this.emit( 'html5-playback-status', {
				type: PlaybackState.EMPTIED,
				mediaNode: this.mediaNode
			} ); //A media element whose networkState was previously not in the NETWORK_EMPTY state has just switched to that state (either because of a fatal error during load that's about to be reported, or because the load() method was invoked while the resource selection algorithm was already running).
		},

		_onAbort: function () {
			if ( this.isStopped || this.isPaused ) return;

			this.emit( 'html5-playback-status', {
				type: PlaybackState.ABORT,
				mediaNode: this.mediaNode
			} ); //The user agent stops fetching the media data before it is completely downloaded, but not due to an error.
		},

		_onError: function ( e ) {
			this._removeMediaListeners();

			if ( this.isStopped || this.isPaused ) {
				this.emit( 'html5-playback-status', {
					type: PlaybackState.STOP,
					mediaNode: this.mediaNode
				} );
				//this._removeMediaSource();
				return;
			}

			//if this.mediaNode.readyState == 0 (HAVE_NOTHING) --> No information regarding the media resource is available. No data for the current playback position is available SO STREAMING ERROR
			this.emit( 'html5-playback-status', {
				type: this.mediaNode.readyState == 3 ? PlaybackState.STOP : PlaybackState.ERROR,
				mediaNode: this.mediaNode
			} ); //An error occurs while fetching the media data.

			//this._removeMediaSource();
		},

		_onLoadedmetadata: function () {
			if ( this.isStopped || this.isPaused ) return;

			this.emit( 'html5-playback-status', {
				type: PlaybackState.EMPTIED,
				mediaNode: this.mediaNode
			} ); //The user agent has just determined the duration and dimensions of the media resource and the text tracks are ready.
		},

		_onTimeupdate: function () {
			if ( this.isStopped || this.isPaused ) return;

			//HACK DUE TO ENDED & STOP EVENTS NOT FIRED ON ANDROID
			if ( this.mediaNode.currentTime.toFixed( 1 ) == this.mediaNode.duration.toFixed( 1 ) ) {
				this.isStopped = true;
				this.emit( 'html5-playback-status', {
					type: PlaybackState.ENDED,
					mediaNode: this.mediaNode
				} );
			} else {
				this.emit( 'html5-playback-status', {
					type: PlaybackState.TIME_UPDATE,
					mediaNode: this.mediaNode
				} );
			}
		},

		_onLoadStart: function () {
			if ( this.isStopped || this.isPaused ) return;

			this.emit( 'html5-playback-status', {
				type: PlaybackState.LOAD_START,
				mediaNode: this.mediaNode
			} ); //The user agent begins looking for media data, as part of the resource selection algorithm.
		},

		_onEnded: function () {
			if ( this.isStopped ) return;

			this._removeMediaListeners();

			this.emit( 'html5-playback-status', {
				type: PlaybackState.ENDED,
				mediaNode: this.mediaNode
			} ); //Playback has stopped because the end of the media resource was reached.
		},

		_onPlay: function () {
			this.emit( 'html5-playback-status', {
				type: PlaybackState.PLAY,
				mediaNode: this.mediaNode
			} ); //The element is no longer paused. Fired after the play() method has returned, or when the autoplay attribute has caused playback to begin.
		},

		_onPause: function () {
			if ( this.isStopped ) {
				//this._removeMediaSource();
				this.emit( 'html5-playback-status', {
					type: PlaybackState.STOP,
					mediaNode: this.mediaNode
				} );
			} else {
				this.emit( 'html5-playback-status', {
					type: PlaybackState.PAUSE,
					mediaNode: this.mediaNode
				} ); //The element has been paused. Fired after the pause() method has returned.
			}
		},

		/*_onStalled:function()
		{
		    if( this.isStopped || this.isPaused ) return;

		    this.emit('html5-playback-status', { type:PlaybackState.STALLED, mediaNode:this.mediaNode });//The user agent is trying to fetch media data, but data is unexpectedly not forthcoming.
		},

		_onProgress:function()
		{
		    if( this.isStopped || this.isPaused ) return;

		    var percent = 0;

		    if( this.mediaNode.buffered.length > 0 )
		    {
		        percent = ( this.mediaNode.buffered.end(0) / this.mediaNode.duration ) * 100;
		    }

		    this.emit('html5-loading-status', { type:PlaybackState.PROGRESS, , mediaNode:this.mediaNode, percent:( this.mediaNode.buffered.end(0) / this.mediaNode.duration ) * 100 });//The user agent is fetching media data.
		},

		_onSuspend:function()
		{
		    if( this.isStopped || this.isPaused ) return;

		    this.emit('html5-playback-status', { type:PlaybackState.SUSPEND, mediaNode:this.mediaNode });//The user agent is intentionally not currently fetching media data.
		},*/

		_initMediaListeners: function ( isLive ) {
			this._errorHandler = on( this.mediaNode, 'error', this._onErrorHandler );

			// if ( OsPlatform.name !== 'Android Browser' ) {
			// 	this._sourceErrorHandler = on( this.audioSource, 'error', this._onErrorHandler ); //Hack to handle 403 Forbidden error
			// }

			this._loadDataHandler = on( this.mediaNode, 'loadeddata', this._onLoadDataHandler );
			this._loadStartHandler = on( this.mediaNode, 'loadstart', this._onLoadStartHandler );
			this._canPlayHandler = on( this.mediaNode, 'canplay', this._onCanPlayHandler );
			this._canPlayThroughHandler = on( this.mediaNode, 'canplaythrough', this._onCanPlayThroughHandler );
			this._waitingHandler = on( this.mediaNode, 'waiting', this._onWaitingHandler );
			this._emptiedHandler = on( this.mediaNode, 'emptied', this._onEmptiedHandler );
			this._abortHandler = on( this.mediaNode, 'abort', this._onAbortHandler );
			this._endedHandler = on( this.mediaNode, 'ended', this._onEndedHandler );
			this._playHandler = on( this.mediaNode, 'play', this._onPlayHandler );
			this._pauseHandler = on( this.mediaNode, 'pause', this._onPauseHandler );
			this._loadedMetadataHandler = on( this.mediaNode, 'loadedmetadata', this._onLoadedMetadataHandler );

			this._timeUpdateHandler = ( !isLive ) ? on( this.mediaNode, 'timeupdate', this._onTimeUpdateHandler ) : null;

			//this._suspendHandler = on( this.mediaNode, 'suspend', this._onSuspendHandler );
			//this._stalledHandler = on( this.mediaNode, 'stalled', this._onStalledHandler );
			//this._progressHandler = on( this.mediaNode, 'progress', this._onProgressHandler );
		},

		_removeMediaListeners: function () {
			this._errorHandler.remove();
			//this._sourceErrorHandler.remove();
			this._loadDataHandler.remove();
			this._loadStartHandler.remove();
			this._canPlayHandler.remove();
			this._canPlayThroughHandler.remove();
			this._waitingHandler.remove();
			this._emptiedHandler.remove();
			this._abortHandler.remove();
			this._endedHandler.remove();
			this._playHandler.remove();
			this._pauseHandler.remove();
			this._loadedMetadataHandler.remove();

			if ( this._timeUpdateHandler )
				this._timeUpdateHandler.remove();
			//this._progressHandler.remove();
			//this._suspendHandler.remove();
			//this._stalledHandler.remove();
		}

	} );

	return html5Player;

} );
