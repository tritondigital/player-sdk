var expect = require( 'expect.js' );
var Q = require( 'q' );
var xmlParser = require( 'sdk/base/util/XmlParser' );

var LiveStreamRepository = require( 'sdk/modules/mediaplayer/liveStreamConfigApi/LiveStreamRepository' );
var ProvisioningXml = require( 'raw!fixtures/Provisioning.xml' );

describe( 'LiveStreamRepository', function () {

	var liveStreamConfigParams, liveStreamConfigMountParams, provisioningXml, endPoint;
	before( function () {
		liveStreamConfigParams = {
			station: 'TRITONRADIOMUSIC',
			mount: null,
			transports: [ 'rtmpe,rtmpte,rtmp,rtmpt,http,hls,hlsts' ],
			version: 1.8
		};

		liveStreamConfigMountParams = {
			station: '',
			mount: 'TRITONRADIOMUSIC',
			version: 1.8
		};

		provisioningXml = xmlParser.parse( ProvisioningXml ).childNodes[ 0 ];
		endPoint = 'http://playerservices.streamtheworld.com/api/livestream';
	} );

	it( 'should request provisioning', function () {
		var liveStreamRepository = new LiveStreamRepository( endPoint );
		var spy = sinon.spy( liveStreamRepository, '_requestProvisioningData' );

		liveStreamRepository.getLiveStreamConfig( liveStreamConfigParams );
		expect( spy.calledOnce ).to.be( true );
	} );

	it( 'should return valid representation of provisioning data when station is specified', function () {
		var liveStreamRepository = new LiveStreamRepository( endPoint );
		var stub = sinon.stub( liveStreamRepository, '_requestProvisioningData' );
		var deferred = Q.defer();

		stub.onFirstCall().returns( deferred.promise );

		deferred.resolve( provisioningXml );

		return liveStreamRepository.getLiveStreamConfig( liveStreamConfigParams )
			.then( function ( data ) {
				expect( data ).to.be.a( 'object' );
				expect( data.mountpoints.mountpoint.length ).to.be( 2 );
			} );

	} );

	it( 'should return valid representation of provisioning data when mount is specified', function () {
		var liveStreamRepository = new LiveStreamRepository( endPoint );
		var stub = sinon.stub( liveStreamRepository, '_requestProvisioningData' );
		var deferred = Q.defer();

		stub.onFirstCall().returns( deferred.promise );

		deferred.resolve( provisioningXml );

		return liveStreamRepository.getLiveStreamConfig( liveStreamConfigMountParams )
			.then( function ( data ) {
				expect( data ).to.be.a( 'object' );
				expect( data.mountpoints.mountpoint.length ).to.be( 2 );
			} );

	} );

	it( 'should never request provisioning  when config already set under refresh timeout ', function () {
		var liveStreamRepository = new LiveStreamRepository( endPoint );
		var configs = {
			TRITONRADIOMUSIC: {
				station: 'TRITONRADIOMUSIC',
				lastRefreshTime: new Date().getTime()
			}
		};

		liveStreamRepository.configs = configs;

		var stub = sinon.stub( liveStreamRepository, '_requestProvisioningData' );

		return liveStreamRepository.getLiveStreamConfig( liveStreamConfigParams ).then( function ( data ) {

			expect( data.station ).to.be( 'TRITONRADIOMUSIC' );
			expect( stub.called ).to.be( false );
		} );

	} );

	it( 'should return error when mount and station are not specified', function () {
		var liveStreamConfigParamsError = {
			station: null,
			mount: null,
			transports: [ 'rtmpe,rtmpte,rtmp,rtmpt,http,hls,hlsts' ],
			version: 1.8
		};
		var liveStreamRepository = new LiveStreamRepository( endPoint );
		return liveStreamRepository.getLiveStreamConfig( liveStreamConfigParamsError )
			.catch( function ( err ) {
				expect( err ).to.be.a( 'object' );
			} );

	} );

} );
