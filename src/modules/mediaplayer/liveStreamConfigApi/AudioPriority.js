var _ = require( 'lodash' );

/**
 * Return mountPoints with specific tags
 *
 * @param {string|string[]} tags
 * @param {boolean} [excludeUntagged=false] Exclude mounts without tags
 * @returns {MountPoint[]}
 */
function _filterByTag( mountPoints, tags, excludeUntagged ) {

	if ( typeof tags == 'string' ) {
		tags = [ tags ];
	}

	if ( _.isUndefined( excludeUntagged ) ) {
		excludeUntagged = false;
	}

	return mountPoints.filter( function ( mountPoint ) {
		return !( _.isEmpty( mountPoint.tags ) && excludeUntagged ) || _.some( tags, function ( tag ) {
			return mountPoint.tags.indexOf( tag ) !== -1;
		} );
	} );

}

/**
 * _sortMountpoints
 * @param mountPoints array
 */
function _sortMountpoints( mountPoints ) {

	return _.sortBy( mountPoints,
		function ( m ) {
			return m.mediaFormat.isAudioAdaptive ? 0 : 1;
		},
		function ( m ) {
			return m.mediaFormat.audioTracks[ 0 ].isAAC ? 0 : 1;
		}
	);
}

/**
 * _sortMountpointsByBitrate
 * @param mountPoints array
 */
function _sortMountpointsByBitrate( mountPoints ) {
	var mountPointsByCodec = _.groupBy( mountPoints, function ( mountPoint ) {
		var codec;

		if ( mountPoint.mediaFormat.isAudioAdaptive ) {
			codec = 'audioAdaptive';
		} else if ( mountPoint.mediaFormat.audioTracks[ 0 ].isAAC ) {
			codec = 'aac';
		} else {
			codec = 'mp3';
		}

		return codec;
	} );

	var codecs = _.keys( mountPointsByCodec );

	return _.flatMap( codecs, function ( codec ) {
		var mountPointsOfCodec = mountPointsByCodec[ codec ];

		return _.orderBy( mountPointsOfCodec, 'bitRate', 'desc' );
	} );
}

/**
 * _excludeTransport
 * @param mountPoints array
 * @param transportExcluded array
 */
function _excludeTransport( mountPoints, transportExcluded ) {

	if ( !_.isArray( transportExcluded ) ) {
		transportExcluded = [ transportExcluded ];
	}

	_.forEach( mountPoints, function ( mountpoint ) {
		var transports = mountpoint.transports.filter( function ( transport ) {
			return !_.some( transportExcluded, function ( transportToExclude ) {
				return transportToExclude.transport === transport.transport &&
					mountpoint.mediaFormat.audioTracks[ 0 ].codec.indexOf( transportToExclude.codec ) > -1;
			} );
		} );

		mountpoint.transports = transports;
	} );

	return mountPoints.filter( function ( mountPoint ) {
		return !_.isEmpty( mountPoint.transports );
	} );
}

/**
 * _excludeAudioAdaptive
 * @param mountPoints array
 */
function _excludeAudioAdaptive( mountPoints ) {
	 return _.filter( mountPoints, function ( mountPoint ) {
	 	return !mountPoint.mediaFormat.isAudioAdaptive;
	 } );
}

/**
 * _excludeHLS
 * @param mountPoints array
 */
function _excludeHLS( mountPoints ) {

	return _excludeTransport( mountPoints, [ {
		transport: 'hls',
		codec: 'aac'
	}, {
		transport: 'hlsts',
		codec: 'aac'
	} ] );
}

/**
 * _forceHLS
 * @param mountPoints array
 */
function _forceHls( mountPoints, isHlsts ) {	
	return _excludeTransport( mountPoints, [ {
		transport: isHlsts?'hls':'hlsts',
		codec: 'aac'
		},
		{
			transport: 'http',
			codec: 'aac'
		},
		{
			transport: 'http',
			codec: 'mp3'
		},
	] );

}




/**
 * sortTransport
 * @param mountPoints array
 * @param transportPriorities array
 */
function _sortTransport( mountPoints, transportPriorities ) {
	var transportPrioritiesFunctions = _.map( transportPriorities, function ( transportPriority ) {
		return function ( transport ) {
			return transport.transport === transportPriority ? 0 : 1;
		};
	} );

	_.forEach( mountPoints, function ( mountPoint ) {
		var transports = mountPoint.transports;
		var sortedTransports = _.sortBy( transports, transportPrioritiesFunctions );

		mountPoint.transports = sortedTransports;
	} );

	return mountPoints;
}

/**
 * _filterByPlatform
 */
function _filterByPlatform( mountPoints, platform, techType ) {

	if ( techType.toLowerCase() == 'flash' ) {
		mountPoints = _excludeAudioAdaptive( mountPoints );
		mountPoints = _excludeTransport( mountPoints, [ {
			transport: 'hlsts',
			codec: 'aac'
		}, {
			transport: 'hls',
			codec: 'aac'
		} ] );
	} else {

		switch ( platform.os.family ) {
		case 'iOS':
			mountPoints = _excludeTransport( mountPoints, {
				transport: 'hlsts',
				codec: 'aac'
			} );

			if ( platform.name === 'Chrome Mobile' ) {
				mountPoints = _excludeTransport( mountPoints, [ {
					transport: 'hls',
					codec: 'aac'
				} ] );
			}

			mountPoints = _sortTransport( mountPoints, [ 'hls', 'http' ] );

			break;
		case 'Android':

			 mountPoints = _sortTransport( mountPoints, [ 'hlsts', 'http' ] );

			break;
		default:
			switch ( platform.name ) {
			case 'Safari':			   
				mountPoints = _excludeTransport( mountPoints, {
					transport: 'hlsts',
					codec: 'aac'
				} );
				mountPoints = _sortTransport( mountPoints, [ 'hls', 'http' ] );
				break;

			case 'IE':				
				if(  platform.version === '11.0' && parseInt( platform.os.version ) > 7  ){
					mountPoints = _excludeTransport( mountPoints, [ {
						transport: 'http',
						codec: 'aac'
					}, {
						transport: 'hlsts',
						codec: 'aac'
					} ] );
				}else{
					mountPoints = _excludeTransport( mountPoints, [ {
						transport: 'hls',
						codec: 'aac'
					}, {
						transport: 'http',
						codec: 'aac'
					}, {
						transport: 'hlsts',
						codec: 'aac'
					} ] );
				}

				
			mountPoints = _sortTransport( mountPoints, [ 'hls', 'http' ] );
			break;

			case 'Microsoft Edge':
				mountPoints = _excludeTransport( mountPoints, [ {
					transport: 'hlsts',
					codec: 'aac'
				} ] );
				mountPoints = _sortTransport( mountPoints, [ 'hls', 'http' ] );
				break;

			default:
				// For Chrome and Firefox				
				mountPoints = _excludeTransport( mountPoints, [ {
					transport: 'hlsts',
					codec: 'aac'
				}, {
					transport: 'hls',
					codec: 'aac'
				} ] );

				mountPoints = _sortTransport( mountPoints, [ 'hls', 'http' ] );
				break;

			}
		}
	}
	return mountPoints;
}

module.exports = {

	/**
	 * Audio Priority
	 * @param mountPoints array
	 * @param platform object
	 * @param techType string
	 * @param tags string or array
	 * @param excludeUntagged string or array
	 * @param removeHLS boolean
	 * @param removeAudioAdaptive boolean
	 */
	filterMountPoints: function ( mountPoints, platform, techType, tags, excludeUntagged, removeHLS, removeAudioAdaptive, forceHls, forceHlsts ) {
		if ( removeHLS && !forceHls && !forceHlsts ) {
			mountPoints = _excludeHLS( mountPoints );
		}
		
		if ( removeAudioAdaptive ) {
			mountPoints = _excludeAudioAdaptive( mountPoints );
		}

		mountPoints = _filterByTag( mountPoints, tags, excludeUntagged );
		mountPoints = forceHls 
			? _forceHls( mountPoints )
			: forceHlsts 
			? _forceHls( mountPoints, true ) 
			: _filterByPlatform( mountPoints, platform, techType )
		
		mountPoints = _sortMountpointsByBitrate( mountPoints );
		mountPoints = _sortMountpoints( mountPoints );
		
		return mountPoints;

	},
	filterByTag: _filterByTag,
	sortMountpoints: _sortMountpoints
};
