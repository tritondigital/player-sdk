var expect = require("expect.js");
var xmlParser = require("sdk/base/util/XmlParser");
var VAST2Parser = require("sdk/modules/ad/vastAd/parser/VAST2Parser");
var VastMultiTrackingEvents = require("raw!fixtures/VastMultiTrackingEvents.xml");
var Companions = require("sdk/base/util/Companions");
var _ = require("lodash");

describe("Companions", function () {
  var vastDocument, xmlHttpRequestMock;
  var sendSpy = sinon.spy();
  var companions = new Companions();
  var mock = sinon.mock(companions);
  var expectation = mock.expects("loadCompanionStatic");

  before(function () {
    console.log = function () {};
    var v2parser = new VAST2Parser();
    vastDocument = xmlParser.parse(VastMultiTrackingEvents);
    vastDocument = v2parser.parse(vastDocument);

    window.fetch = sendSpy;
  });

  beforeEach(function () {
    sendSpy.reset();
    expectation.reset();
  });

  it("should call 6 tracking view url ", function () {
    var companion = vastDocument.vastAd.inlineAd.creatives[1].companionAds[3];
    companions.loadVASTCompanionAd("id", companion);
    expect(sendSpy.callCount).to.be(6);
  });

  it("should call 1 tracking view url ", function () {
    var companion = vastDocument.vastAd.inlineAd.creatives[1].companionAds[0];
    companions.loadVASTCompanionAd("id32", companion);
    expect(sendSpy.callCount).to.be(1);
  });

  it("should not call tracking view ", function () {
    var companion = vastDocument.vastAd.inlineAd.creatives[1].companionAds[5];
    companions.loadVASTCompanionAd("id32", companion);
    expect(sendSpy.callCount).to.be(0);
  });
});
