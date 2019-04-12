var _ = require( 'lodash' )
var expect = require( 'expect.js' );
var ConnectionIterator = require( 'sdk/modules/mediaplayer/liveStreamConfigApi/ConnectionIterator' );

describe( 'ConnectionIterator', function () {

	var connectionIterator, streamingConnections;
	beforeEach( function () {
		streamingConnections = [ {
			url: 1,
			mount: 'mount1'
		}, {
			url: 2,
			mount: 'mount2'
		}, {
			url: 3,
			mount: 'mount2'
		} ]
		connectionIterator = new ConnectionIterator( streamingConnections );

	} );

	it( 'should reset all connections', function () {
		connectionIterator.streamingConnectionIndex = 3;
		connectionIterator.reset();
		expect( connectionIterator.streamingConnectionIndex ).to.be( 0 );
	} );

	it( 'should return the current connection', function () {
		connectionIterator.streamingConnectionIndex = 1;
		expect( connectionIterator.current() ).to.eql( {
			url: 2,
			mount: 'mount2'
		} );
	} );

	it( 'should return the next connection', function () {
		connectionIterator.streamingConnectionIndex = 0;
		expect( connectionIterator.next() ).to.eql( {
			url: 2,
			mount: 'mount2'
		} );
	} );

	it( 'should return if is the last connection by mount', function () {
		connectionIterator.streamingConnectionIndex = 0;
		expect( connectionIterator.isLastConnectionByMount() ).to.be( true );
		connectionIterator.streamingConnectionIndex = 1;
		expect( connectionIterator.isLastConnectionByMount() ).to.be( false );
	} );

} );
