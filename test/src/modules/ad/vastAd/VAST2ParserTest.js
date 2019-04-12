var expect = require( 'expect.js' );
var xmlParser = require('sdk/base/util/XmlParser');
var VAST2Parser = require( 'sdk/modules/ad/vastAd/parser/VAST2Parser' );
var VastMultiTrackingEvents = require( 'raw!fixtures/VastMultiTrackingEvents.xml' );

describe( 'VAST2Parser', function () {
    var vastDocument;

    before( function(){
        var v2parser = new VAST2Parser();
        vastDocument = xmlParser.parse(VastMultiTrackingEvents );
        vastDocument = v2parser.parse(vastDocument);
    })

    it( 'should return companions with 5 tracking events', function () {
        expect(vastDocument.vastAd.inlineAd.creatives[1].companionAds[3].creativeView).to.have.length(6);
    });

    it( 'should return companions with 1 tracking events', function () {
        expect(vastDocument.vastAd.inlineAd.creatives[1].companionAds[0].creativeView).to.have.length(1);
    });

    it( 'should return NULL on companions without tracking events', function () {
        expect(vastDocument.vastAd.inlineAd.creatives[1].companionAds[1].creativeView).to.be(null)
    });


});