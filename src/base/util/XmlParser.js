var lodash = require( 'lodash' );
var XmlToJSON = require( 'sdk/base/util/XmlToJSON' );
/**
 * XmlParser
 *
 */
var XmlParser = {

	parse: function ( data ) {
		var parser, xmlDoc;

		if ( window.DOMParser ) {
			parser = new DOMParser();
			xmlDoc = parser.parseFromString( data, 'text/xml' );
		} else { // Internet Explorer
			xmlDoc = new ActiveXObject( 'Microsoft.XMLDOM' );
			xmlDoc.async = false;
			xmlDoc.loadXML( data );
		}
		return xmlDoc;
	},
	textContent: function ( node ) {
		var _result = '';
		if ( node ) {
			lodash.forEach( node.childNodes, function ( child ) {
				switch ( child.nodeType ) {
				case 3: // TEXT_NODE
				case 2: // ATTRIBUTE_NODE
				case 4: // CDATA_SECTION_NODE
					_result += child.nodeValue;
				}
			} );
		}
		return _result;
	},

    xmlToJson: function( xml ){
        var options = {
            mergeCDATA: true,   // extract cdata and merge with text nodes
            grokAttr: true,     // convert truthy attributes to boolean, etc
            grokText: true,     // convert truthy text/attr to boolean, etc
            normalize: true,    // collapse multiple spaces to single space
            xmlns: false,        // include namespaces as attributes in output
            namespaceKey: '_ns',    // tag name for namespace objects
            textKey: '_text',   // tag name for text nodes
            valueKey: '_value',     // tag name for attribute values
            attrKey: '_attr',   // tag for attr groups
            cdataKey: '_cdata',  // tag for cdata nodes (ignored if mergeCDATA is true)
            attrsAsObject: true,    // if false, key is used as prefix to name, set prefix to '' to merge children and attrs.
            stripAttrPrefix: true,  // remove namespace prefixes from attributes
            stripElemPrefix: true,  // for elements of same name in diff namespaces, you can enable namespaces and access the nskey property
            childrenAsArray: false   // force children into arrays
        };

        return XmlToJSON.parseXML( xml, options );
    }
};


module.exports = XmlParser;
