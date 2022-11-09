var _ = require( 'lodash' );

var expect = require( 'expect.js' );
var EventEmitter = require( 'events' ).EventEmitter;

var MediaElement = require( 'sdk/base/util/MediaElement' );

var PlaybackState = require( 'sdk/base/playback/PlaybackState' );

var MediaElementInjector = require( 'injected!sdk/base/util/MediaElement' );

var sinonStubPromise = require('sinon-stub-promise');
sinonStubPromise(sinon);

describe( 'MediaElement', function () {

	var url = 'http://tritondigital.com/mystream';

	var audioMock;

	var loadSpy = sinon.spy();
	var pauseSpy = sinon.spy();
	var playSpy;

	beforeEach( function () {
		playSpy = sinon.stub();
		audioMock = _.assign( new EventEmitter(), {
			load: loadSpy,
			pause: pauseSpy,
			play: playSpy.returnsPromise().resolves(),
			src: '',
			crossOrigin: '',
			addEventListener: function ( event, callback ) {
				this.on( event, callback );
			},
			removeEventListener: function ( event ) {
				this.removeAllListeners( event );
			}
		} );

		window.Audio = function () {
			return audioMock;
		};
	} );

	afterEach( function () {
		sinon.restore();
		if ( MediaElement.audioNode ) {
			MediaElement.resetAudioNode();
		}

		loadSpy.reset();
		pauseSpy.reset();
		playSpy.reset();
	} );

	it( 'should set audio src when calling playAudio', function () {
		MediaElement.playAudio( url, false );

		expect( MediaElement.audioNode.src ).to.be( url );

		expect( loadSpy.called ).to.be( true );

	} );

	it( 'should load the Hls module when calling playAudio with hls', function () {

        var MediaElementWithMock = MediaElementInjector( {} );

        // Before playing:
        expect( MediaElementWithMock.hls ).to.be( undefined );
        expect( MediaElementWithMock.isStopped() ).not.to.be( false );
        expect( MediaElementWithMock.url ).to.be( undefined );

		MediaElementWithMock.playAudio( url, true );

        // After playing:
        expect( MediaElementWithMock.hls ).not.to.be( undefined );
        expect( MediaElementWithMock.isStopped() ).to.be( false );
        expect( MediaElementWithMock.url ).not.to.be( undefined );
	} );	

	it( 'should be able to pause', function () {
		MediaElement.playAudio( url, false );
		MediaElement.pause();

		expect( MediaElement.audioNode.src ).to.be( url );
		expect( loadSpy.called ).to.be( true );
		expect( pauseSpy.called ).to.be( true );
	} );

	it( 'should be able to resume after pause', function () {
		MediaElement.playAudio( url, false );
		MediaElement.pause();
		MediaElement.resume();

		expect( MediaElement.audioNode.src ).to.be( url );
		expect( loadSpy.called ).to.be( true );
		expect( pauseSpy.called ).to.be( true );
		expect( playSpy.called ).to.be( true );
	} );


	it( 'should be able to unMute', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.PLAY );

			done();
	} );

		MediaElement.mute();
		MediaElement.unMute();

		MediaElement.audioNode.emit( 'play' );
	} );

	it( 'should be able to set volume', function () {
		MediaElement.setVolume( 0.5 );

		expect( MediaElement.audioNode.volume ).to.be( 0.5 );
	} );

	it( 'should emit the DATA_LOADING html5-playback-status event on the media tag\'s loadeddata event', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.DATA_LOADING );

			done();
		} );

		MediaElement.playAudio( url, false );

		MediaElement.audioNode.emit( 'loadeddata' );
	} );

	it( 'should emit the LOAD_START html5-playback-status event on the media tag\'s loadstart event', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.LOAD_START );

			done();
		} );

		MediaElement.playAudio( url, false );

		MediaElement.audioNode.emit( 'loadstart' );
	} );

	it( 'should emit the CAN_PLAY html5-playback-status event on the media tag\'s canplay event', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.CAN_PLAY );
			expect( playSpy.called ).to.be( false );

			done();
		} );

		MediaElement.playAudio( url, false );

		MediaElement.audioNode.emit( 'canplay' );
	} );

	it( 'should emit the CAN_PLAY_THROUGH html5-playback-status event on the media tag\'s canplaythough event', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.CAN_PLAY_THROUGH );
			expect( playSpy.called ).to.be( true );

			done();
		} );

		MediaElement.playAudio( url, false );

		MediaElement.audioNode.emit( 'canplaythrough' );
	} );

	it( 'should emit the WAITING html5-playback-status event on the media tag\'s waiting event', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.WAITING );

			done();
		} );

		MediaElement.playAudio( url, false );

		MediaElement.audioNode.emit( 'waiting' );
	} );

	it( 'should emit the EMPTIED html5-playback-status event on the media tag\'s emptied event', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.EMPTIED );

			done();
		} );

		MediaElement.playAudio( url, false );

		MediaElement.audioNode.emit( 'emptied' );
	} );

	it( 'should emit the ABORT html5-playback-status event on the media tag\'s abort event', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.ABORT );

			done();
		} );

		MediaElement.playAudio( url, false );

		MediaElement.audioNode.emit( 'abort' );
	} );

	it( 'should emit the ENDED html5-playback-status event on the media tag\'s ended event', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.ENDED );

			done();
		} );

		MediaElement.playAudio( url, false );

		MediaElement.audioNode.emit( 'ended' );
	} );

	it( 'should emit the PLAY html5-playback-status event on the media tag\'s play event', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.PLAY );

			done();
		} );

		MediaElement.playAudio( url, false );

		MediaElement.audioNode.emit( 'play' );
	} );

	it( 'should emit the PAUSE html5-playback-status event on the media tag\'s pause event when media tag is not stopped', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.PAUSE );

			done();
		} );

		MediaElement.playAudio( url, false );

		MediaElement.audioNode.emit( 'pause' );
	} );


	it( 'should emit the EMPTIED html5-playback-status event on the media tag\'s loadedmetadata event', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.EMPTIED );

			done();
		} );

		MediaElement.playAudio( url, false );

		MediaElement.audioNode.emit( 'emptied' );
	} );

	it( 'should emit the ENDED html5-playback-status event on the media tag\'s timeupdate event when reached end of the audio file', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.ENDED );

			done();
		} );

		MediaElement.playAudio( url, false );
		MediaElement.audioNode.currentTime = 1;
		MediaElement.audioNode.duration = 1;
		MediaElement.audioNode.emit( 'timeupdate' );
	} );

	it( 'should emit the TIME_UPDATE html5-playback-status event on the media tag\'s timeupdate event when end of file hasn\'t bean reached', function ( done ) {
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.TIME_UPDATE );

			done();
		} );

		MediaElement.playAudio( url, false );
		MediaElement.audioNode.currentTime = 1;
		MediaElement.audioNode.duration = 2;
		MediaElement.audioNode.emit( 'timeupdate' );
	} );


	it( 'should emit the ERROR html5-playback-status event on the media tag\'s error event when media node had no data to play', function( done ){
		MediaElement.once( 'html5-playback-status', function ( e ) {
			expect( e.type ).to.be( PlaybackState.ERROR );
			expect( MediaElement.audioNode ).to.be( null );
			done();
		} );

		MediaElement.playAudio( url, false );
		MediaElement.audioNode.readyState = 2;
		MediaElement.audioNode.emit( 'error' );

	} );



} );
