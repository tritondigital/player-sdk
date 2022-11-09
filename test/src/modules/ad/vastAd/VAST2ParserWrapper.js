var expect = require( 'expect.js' );
var xmlParser = require( 'sdk/base/util/XmlParser' );
var VAST2Parser = require( 'sdk/modules/ad/vastAd/parser/VAST2Parser' );
var WrapperExample = require( 'raw!fixtures/WrapperExample.xml' );

describe( 'VAST2ParserWrapper', function () {
    var vastDocument;

    before( function(){
        var v2parser = new VAST2Parser();
        vastDocument = xmlParser.parse( WrapperExample );
        vastDocument = v2parser.parse( vastDocument );
    } );

    it( 'should contain wrapper ad', function () {
        expect( vastDocument.vastAd.wrapperAd ).to.not.be( null );
    } );

    it( 'should contain one vastAdTagURL', function () {
        expect( vastDocument.vastAd.wrapperAd.vastAdTagURL ).to.not.be( null );
        expect( vastDocument.vastAd.wrapperAd.vastAdTagURL ).to.contain( 'http' );
    } );


} );