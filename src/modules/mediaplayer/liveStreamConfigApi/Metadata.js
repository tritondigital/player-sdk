function Metadata( data ) {
	this.shoutcastV1 = null;
	this.shoutcastV2 = null;
	this.sseSideband = null;

	parse( this, data );

	function parse( context, data ) {
		context.shoutcastV1 = data[ 'shoutcast-v1' ] ? {
			active: data[ 'shoutcast-v1' ]._attr.enabled._value,
			mountSuffix: data[ 'shoutcast-v1' ]._attr.mountSuffix._value
		} : null;

		context.shoutcastV2 = data[ 'shoutcast-v2' ] ? {
			active: data[ 'shoutcast-v2' ]._attr.enabled._value,
			mountSuffix: data[ 'shoutcast-v2' ]._attr.mountSuffix._value
		} : null;

		context.sseSideband = data[ 'sse-sideband' ] ? {
			active: data[ 'sse-sideband' ]._attr.enabled._value,
			streamSuffix: data[ 'sse-sideband' ]._attr.streamSuffix._value,
			metadataSuffix: data[ 'sse-sideband' ]._attr.metadataSuffix._value
		} : null;
	}

}

module.exports = Metadata;
