var _ = require( 'lodash' );

var ArrayHelper = require( 'sdk/base/util/ArrayHelper' );

function Servers( data ) {
	this.servers = null;

	parse( this, data );

	function parse( context, data ) {
		context.servers = _.flatMap( ArrayHelper.toSafeArray( data.server ), function ( server ) {
			var ip = server.ip._text;

			return ArrayHelper.toSafeArray(server.ports.port).map( function ( port ) {
				var type = port._attr.type._value;
				var portNumber = port._text;

				return type + '://' + ip + ':' + portNumber;
			} );
		} );
	}
}

module.exports = Servers;
