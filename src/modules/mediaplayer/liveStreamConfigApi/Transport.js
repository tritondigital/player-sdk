function Transport( data ) {
	this.mountSuffix = null;
	this.transport = null;

	parse( this, data );

	function parse( context, data ) {
		context.mountSuffix = data._attr ? data._attr.mountSuffix._value : null;
		context.transport = data._text || null;
	}
}

module.exports = Transport;
