var _ = require( 'lodash' );

function MountPointHelper() {

	this.hasHLS = function ( MountPoint ) {
		if ( !MountPoint ) {
			MountPoint = this;
		}

		return _.some( MountPoint.transports, function ( transport ) {
			return transport.transport === 'hls';
		} );
	};

	this.hasHLSTS = function ( MountPoint ) {
		if ( !MountPoint ) {
            MountPoint = this;
		}
		return _.some( MountPoint.transports, function ( transport ) {
			return transport.transport === 'hlsts';
		} );
	};

}

module.exports = MountPointHelper;
