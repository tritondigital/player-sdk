var _ = require( 'lodash' );
var EventEmitter = require( 'events' ).EventEmitter;
var Hls = require( 'hls.js' );
var PlaybackState = require( 'sdk/base/playback/PlaybackState' );
var StateMachine = require( 'javascript-state-machine' );
var hls;
var OsPlatform = require( 'platform' );

var STATE = {
	IDLE: 'IDLE',
	PLAYING: 'PLAYING',
	STOPPED: 'STOPPED',
	PAUSED: 'PAUSED'
};

var fsm = StateMachine.create( {
	initial: STATE.STOPPED,
	error: function ( eventName, from ) {
		console.warn( 'Event', eventName, 'inappropriate in current state', from );
	},
	events: [ {
		name: 'play',
		from: STATE.STOPPED,
		to: STATE.PLAYING
	}, {
		name: 'play',
		from: STATE.PLAYING,
		to: STATE.PLAYING
	}, {
		name: 'stop',
		from: STATE.PLAYING,
		to: STATE.STOPPED
	}, {
		name: 'stop',
		from: STATE.PAUSED,
		to: STATE.STOPPED
	}, {
		name: 'pause',
		from: STATE.PLAYING,
		to: STATE.PAUSED
	}, {
		name: 'resume',
		from: STATE.PAUSED,
		to: STATE.PLAYING
	} ]
} );

function _onLoadedData() {
	if ( fsm.is( STATE.STOPPED ) || fsm.is( STATE.PAUSED ) ) return;

	this.emit( 'html5-playback-status', {
		type: PlaybackState.DATA_LOADING,
		mediaNode: this.audioNode
	} );
}

function _onLoadStart() {
	if ( fsm.is( STATE.STOPPED ) || fsm.is( STATE.PAUSED ) ) return;

	this.emit( 'html5-playback-status', {
		type: PlaybackState.LOAD_START,
		mediaNode: this.audioNode
	} );
}

function _onCanPlay() {
	var context = this;
	
	if ( fsm.is( STATE.STOPPED ) || fsm.is( STATE.PAUSED ) ) return;

	if( this.url !== null ){
		if( OsPlatform.name === 'IE' && OsPlatform.version === '11.0' && parseInt( OsPlatform.os.version ) >= 7) {
			this.audioNode.play();
		}else{
			context.emit( 'html5-playback-status', {
			type: PlaybackState.CAN_PLAY,
				mediaNode: context.audioNode
			} );
			
			this.audioNode.play()			
			.then(function(){							
		})
		.catch(function(e){
			context.handleHTMLPlayError(e);
		} );
	}
}
}

function _onCanPlayThrough() {
	var context = this;
	if ( fsm.is( STATE.STOPPED ) || fsm.is( STATE.PAUSED ) ) return;

	if( this.url !== null ){

		if( OsPlatform.name === 'IE' && OsPlatform.version === '11.0' && parseInt( OsPlatform.os.version ) >= 7) {
			this.audioNode.play();
		}else{
		this.audioNode.play()
		.then(function(){			
			context.emit( 'html5-playback-status', {
			type: PlaybackState.CAN_PLAY_THROUGH,
				mediaNode: context.audioNode
			} );
		})
		.catch(function(e){
			context.handleHTMLPlayError(e);
		} );
	}
		
	}
}

function _onWaiting() {
	if ( fsm.is( STATE.STOPPED ) || fsm.is( STATE.PAUSED ) ) return;

	this.emit( 'html5-playback-status', {
		type: PlaybackState.WAITING,
		mediaNode: this.audioNode
	} );
}

function _onEmptied() {
	if ( fsm.is( STATE.STOPPED ) || fsm.is( STATE.PAUSED ) ) return;

	this.emit( 'html5-playback-status', {
		type: PlaybackState.EMPTIED,
		mediaNode: this.audioNode
	} );
}

function _onAbort() {
	if ( fsm.is( STATE.STOPPED ) || fsm.is( STATE.PAUSED ) ) return;

	this.emit( 'html5-playback-status', {
		type: PlaybackState.ABORT,
		mediaNode: this.audioNode
	} );
}

function _onEnded() {
	if ( fsm.is( STATE.STOPPED ) ) return;
	this.emit( 'html5-playback-status', {
		type: PlaybackState.ENDED,
		mediaNode: this.audioNode
	} );
}

function _onPlay() {

	if( this.url !== null ){
		this.emit( 'html5-playback-status', {
			type: PlaybackState.PLAY,
			mediaNode: this.audioNode
		} );
	}
}

function _onPause() {
	if ( !fsm.is( STATE.STOPPED ) ) {
		this.emit( 'html5-playback-status', {
			type: PlaybackState.PAUSE,
			mediaNode: this.audioNode
		} );
	} else {
		this.emit( 'html5-playback-status', {
			type: PlaybackState.STOP,
			mediaNode: this.audioNode
		} );
	}
}

function _onError() {

	var audioNode = this.audioNode;

	if ( fsm.is( STATE.STOPPED ) ) {
		this.emit( 'html5-playback-status', {
			type: PlaybackState.STOP,
			mediaNode: audioNode
		} );
	} else if ( audioNode.readyState != 3 ) {
		this.resetAudioNode();
		this.emit( 'html5-playback-status', {
			type: PlaybackState.ERROR,
			mediaNode: audioNode
		} );
	} else {
		this.emit( 'html5-playback-status', {
			type: PlaybackState.STOP,
			mediaNode: audioNode
		} );
	}

}

function _onOffline(){
	console.log( 'MediaElement::offline' );
	var audioNode = this.audioNode;	
	 this.emit( 'html5-playback-status', {
	 	type: PlaybackState.ERROR,
	 	mediaNode: audioNode
	 } );
}

function _onTimeUpdate() {
	if ( fsm.is( STATE.STOPPED ) || fsm.is( STATE.PAUSED ) ) return;

	if ( this.audioNode.currentTime.toFixed( 1 ) == this.audioNode.duration.toFixed( 1 ) ) {
		this.emit( 'html5-playback-status', {
			type: PlaybackState.ENDED,
			mediaNode: this.audioNode
		} );
	} else {
		if ( !this.isLive ) {
			this.emit( 'html5-playback-status', {
				type: PlaybackState.TIME_UPDATE,
				mediaNode: this.audioNode
			} );
		}
	}
}

function attachEvents() {
	this.boundOnOffline = _onOffline.bind(this);
	this.audioNode.addEventListener( 'loadeddata', _onLoadedData.bind( this ) );
	this.audioNode.addEventListener( 'loadstart', _onLoadStart.bind( this ) );
	this.audioNode.addEventListener( 'canplay', _onCanPlay.bind( this ) );
	this.audioNode.addEventListener( 'canplaythrough', _onCanPlayThrough.bind( this ) );
	this.audioNode.addEventListener( 'waiting', _onWaiting.bind( this ) );
	this.audioNode.addEventListener( 'emptied', _onEmptied.bind( this ) );
	this.audioNode.addEventListener( 'abort', _onAbort.bind( this ) );
	this.audioNode.addEventListener( 'ended', _onEnded.bind( this ) );
	this.audioNode.addEventListener( 'play', _onPlay.bind( this ) );
	this.audioNode.addEventListener( 'pause', _onPause.bind( this ) );
	this.audioNode.addEventListener( 'timeupdate', _onTimeUpdate.bind( this ) );
	this.audioNode.addEventListener( 'error', _onError.bind( this ) );
	window.addEventListener('offline', this.boundOnOffline);
}

function removeEvents() {
	this.audioNode.removeEventListener( 'loadeddata', _onLoadedData );
	this.audioNode.removeEventListener( 'loadstart', _onLoadStart );
	this.audioNode.removeEventListener( 'canplay', _onCanPlay );
	this.audioNode.removeEventListener( 'canplaythrough', _onCanPlayThrough );
	this.audioNode.removeEventListener( 'waiting', _onWaiting );
	this.audioNode.removeEventListener( 'emptied', _onEmptied );
	this.audioNode.removeEventListener( 'abort', _onAbort );
	this.audioNode.removeEventListener( 'ended', _onEnded );
	this.audioNode.removeEventListener( 'play', _onPlay );
	this.audioNode.removeEventListener( 'pause', _onPause );
	this.audioNode.removeEventListener( 'timeupdate', _onTimeUpdate );
	this.audioNode.removeEventListener( 'error', _onError );
	window.removeEventListener('offline', this.boundOnOffline );
}

function getAudioNode() {

	if ( !this.audioNode ) {

		this.audioNode = new Audio();
		this.audioNode.autoplay = false;
		this.audioNode.preload = 'none';

		attachEvents.call( this );
	}

	return this.audioNode;
}

module.exports = _.assign( new EventEmitter(), {
	audioNode: null,

	init: function () {
			var context = this;
			this.audioNode = getAudioNode.call( this );
			this.url = null;
			this.audioNode.src = '';			
	},

	playAudio: function ( url, useHlsLibrary, isLive ) {	
		if (this.audioNode ){
			this.stop();			
		}	
			
		this.audioNode = getAudioNode.call( this );
		this.url = url || this.url;
		this.isLive = isLive || this.isLive;
		this.useHlsLibrary = useHlsLibrary || this.useHlsLibrary;

		if ( this.useHlsLibrary ) {
			var config = {
				maxBufferLength: 30
			}
			this.hls = new Hls(config);
			this.hls.loadSource( url );
			this.hls.attachMedia( this.audioNode );			
		} else {
			this.audioNode.src = url;
			this.audioNode.load();
		}

		fsm.play();
	},

	stop: function () {
		var context = this;
		if ( fsm.is( STATE.STOPPED ) ) return;

		this.audioNode = getAudioNode.call( this );

		fsm.stop();
		
		this.audioNode.pause();
		if( OsPlatform.name !== 'Safari'  || this.audioNode.src.indexOf('m3u8') > -1 || this.useHlsLibrary) {
		setTimeout(function(){ 
			context.audioNode.src = '';
			context.url = null;
				context.resetAudioNode();
		 }, 300);
		}else{
			setTimeout(function(){ 
				context.url = null;
				context.resetAudioNode();
			 }, 300);
		}
		
		if( OsPlatform.os.family === 'iOS' && OsPlatform.name === 'Chrome Mobile') {
			window.stop();			
		}
				
		 if ( this.useHlsLibrary ) {
			this.hls.detachMedia();
			this.hls.stopLoad();
			this.hls.destroy();
		 }

		
	},

	pause: function () {
		if ( fsm.is( STATE.PAUSED ) ) return;

		this.audioNode = getAudioNode.call( this );

		this.audioNode.pause();
		fsm.pause();
	},

	resume: function () {
		var context = this;
		if ( !fsm.is( STATE.PAUSED ) ) return;

		this.audioNode = getAudioNode.call( this );
		if( OsPlatform.name === 'IE' && OsPlatform.version === '11.0' && parseInt( OsPlatform.os.version ) >= 7) {
			this.audioNode.play();
		}else{
		this.audioNode.play().catch(function(e){
			context.handleHTMLPlayError(e);
		});
		}
		
		fsm.resume();
	},

	mute: function () {
		if ( !fsm.is( STATE.PLAYING ) ) return;
		this.audioNode = getAudioNode.call( this );
		this.stop();
	},

	unMute: function () {
		if ( fsm.is( STATE.PLAYING ) ) return;
		this.audioNode = getAudioNode.call( this );		
	},

	setVolume: function ( volume ) {
		this.audioNode = getAudioNode.call( this );
		this.audioNode.volume = volume;
		if(volume == 0){
			this.mute();
		}
	},

	isStopped: function () {
		return fsm.is( STATE.STOPPED );
	},

	resetAudioNode: function () {

		removeEvents.call( this );
		this.audioNode = null;

		if ( fsm.can( 'stop' ) ) {
			fsm.stop();
		}
	},

	destroyAudioElement: function () {
		this.emit( 'destroyAudioElement' );		
	},	

 handleHTMLPlayError: function(e){		
		var context = this;	
		if ( e.name !== 'NotSupportedError' ) {
			if ( e.name === 'NotAllowedError' ) {
				this.emit( 'html5-playback-status', {
					type: PlaybackState.PLAY_NOT_ALLOWED,
					mediaNode: context.audioNode
				} );
			}
		}
	}
} );
