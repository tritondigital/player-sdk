var _ = require('lodash');
var expect = require('expect.js');

var PlatformInjector = require('injected!sdk/base/util/Platform');

var LocationHelperMock = {
  currentProtocolIsHttps: _.noop,
  getProtocol: function getProtocol() {
    return 'http:';
  }
};

var Platform = PlatformInjector({
  'sdk/base/util/LocationHelper': LocationHelperMock
});

describe('Platform', function () {
  it('should return the prod platform if platformId is invalid', function () {
    var platform = new Platform('bad01');

    expect(platform.endpoint.liveStream).to.be('playerservices.streamtheworld.com/api/livestream');
  });
});
