/**
 * Xhr provider
 * TODO: use request/registry
 * http://www.sitepen.com/blog/2012/08/21/introducing-dojorequest/
 * http://dojotoolkit.org/documentation/tutorials/1.8/ajax/
 * http://dojotoolkit.org/reference-guide/1.8/dojo/request/registry.html
 */
define(["dojo/_base/declare", "dojo/request/xhr"], function (declare, xhr) {
  var xhrProvider = declare([], {
    constructor: function () {
      if ("withCredentials" in new XMLHttpRequest()) {
        this.corsSupport = "xhr";
      } else if (
        typeof XDomainRequest == "object" ||
        typeof XDomainRequest == "function"
      ) {
        this.corsSupport = "xd";
      } else {
        console.error(
          "xhrProvider::constructor - CORS in not supported by the browser"
        );
      }
    },

    request: function (
      url,
      requestData,
      requestArgs,
      successCallback,
      errorCallback
    ) {
      //IE: http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
      if (this.corsSupport == "xd") {
        for (var queryParam in requestArgs.query) {
          url += url.indexOf("?") != -1 ? "&" : "?";
          url += queryParam + "=" + requestArgs.query[queryParam];
        }
        if (requestArgs.preventCache) {
          url += url.indexOf("?") != -1 ? "&" : "?";
          url += "_cb=" + new Date().getTime();
        }

        var xdr = new XDomainRequest();
        xdr.open(requestArgs.method || "GET", url);
        xdr.timeout = 0;
        xdr.onload = function () {
          if (requestArgs.handleAs.toLowerCase() == "json") {
            if (successCallback != null && successCallback != undefined)
              successCallback(requestData, JSON.parse(xdr.responseText));
          } else {
            var response;
            if (window.DOMParser) {
              var parser = new window.DOMParser();
              response = parser.parseFromString(xdr.responseText, "text/xml");
            } else {
              response = new ActiveXObject("Microsoft.XMLDOM");
              response.async = false;
              response.loadXML(xdr.responseText);
            }
            if (successCallback != null && successCallback != undefined)
              successCallback(
                requestData,
                response.documentElement || response
              );
          }
        };
        xdr.onprogress = function () {};
        xdr.ontimeout = function () {};
        xdr.onerror = function () {
          if (errorCallback != null && errorCallback != undefined)
            errorCallback(requestData, "An unexpected error occurred");
        };
        //Hot-fix: http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
        //The problem has to do with IE timing out the request even though data is being transmitted.
        setTimeout(function () {
          xdr.send();
        }, 250);
      } else if (this.corsSupport == "xhr") {
        xhr(url, requestArgs).then(
          function (data) {
            if (successCallback != null && successCallback != undefined)
              successCallback(requestData, data.documentElement || data);
          },
          function (error) {
            if (errorCallback != null && errorCallback != undefined)
              errorCallback(
                requestData,
                "An unexpected error occurred: " + error
              );
          }
        );
      } else {
        console.error(
          "xhrProvider::request - CORS in not supported by the browser"
        );
      }
    },
  });

  return xhrProvider;
});
