function Tag( data ) {
	this.name = null;

	parse( this, data );

	function parse( context, data ) {
		// Code
		context.name = data ? data : null;
	}
}

module.exports = Tag;
