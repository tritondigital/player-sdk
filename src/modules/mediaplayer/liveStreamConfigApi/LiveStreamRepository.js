var Q = require('q');
var _ = require('lodash');
var XmlParser = require('sdk/base/util/XmlParser');
var XhrProvider = require('sdk/base/util/XhrProvider');
var DEFAULT_TRANSPORTS = ['http', 'hls'];
var REFRESH_TIMEOUT = 60000;

var LIVE_STREAM_CONFIG_VERSION = '1.10';

/**
 * _requestData
 */
function _requestProvisioningData(endPoint, query) {
  return Q.Promise(function (resolve, reject, notify) {
    var xhrProv = new XhrProvider();

    xhrProv.request(
      endPoint,
      query,
      {
        handleAs: 'xml',
        preventCache: true,
        query: query,
        headers: {
          'X-Requested-With': null,
          'Content-Type': 'text/plain; charset=utf-8'
        }
      },
      function (query, data) {
        //Success
        if (query.station) {
          console.log('liveStreamAPI::_onLoadComplete - station:' + query.station);
        } else if (query.mount) {
          console.log('liveStreamAPI::_onLoadComplete - mount:' + query.mount);
        }
        resolve(data);
      },
      function (query, err) {
        //Error
        if (query.station) {
          console.error('liveStreamAPI::_onLoadError - station:' + query.station);
        } else if (query.mount) {
          console.error('liveStreamAPI::_onLoadError - mount:' + query.mount);
        }
        reject(err);
      }
    );
  });
}

function getQuery(params) {
  var query = _.assign({}, params);
  if (query == undefined || query == null) {
    throw new Error('liveStreamAPI::getLiveStreamConfig() A query must be provided.');
  }

  if (typeof query == 'string') {
    query = {
      station: query
    };
  }

  if (typeof query != 'object') {
    throw new Error('liveStreamAPI::getLiveStreamConfig() A query object must be provided.');
  }

  if (!query.station && !query.mount) {
    throw new Error('liveStreamAPI::getLiveStreamConfig(): A query must contain at least a station or mount parameter.');
  }

  if (!query.transports || query.transports.length == 0) {
    query.transports = DEFAULT_TRANSPORTS;
  }
  if (query.transports) {
    query.transports = query.transports.join(',');
  }

  return query;
}

/**
 * LiveStreamRepository
 * @param endPoint string
 */
function LiveStreamRepository(endPoint) {
  var self = this;
  this.configs = [];

  this._requestProvisioningData = _requestProvisioningData;

  this.getConfig = function (query) {
    var config;
    if (query.station) {
      config = this.configs[query.station];
    } else {
      delete query.station;
    }

    if (query.mount) {
      config = this.configs[query.mount + '_MOUNT'];
    } else {
      delete query.mount;
    }

    return config;
  };

  this.getLiveStreamConfig = function (params) {
    return Q.Promise(function (resolve, reject) {
      try {
        var query = getQuery(params);
      } catch (err) {
        reject(err);
      }

      var config = self.getConfig(query);

      if (config && config.lastRefreshTime + REFRESH_TIMEOUT >= new Date().getTime()) {
        //@TODO real cache
        resolve(config);
      } else {
        query.version = LIVE_STREAM_CONFIG_VERSION;

        self._requestProvisioningData(endPoint, query).then(function (data) {
          var dataToJson = XmlParser.xmlToJson(data);
          if (query.station) {
            self.configs[query.station] = dataToJson;
            self.configs[query.station].lastRefreshTime = new Date().getTime();
          } else if (query.mount) {
            self.configs[query.mount + '_MOUNT'] = dataToJson;
            self.configs[query.mount + '_MOUNT'].lastRefreshTime = new Date().getTime();
          }

          resolve(dataToJson);
        });
      }
    });
  };
}

module.exports = LiveStreamRepository;
