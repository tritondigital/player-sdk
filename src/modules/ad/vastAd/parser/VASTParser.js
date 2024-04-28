var xmlParser = require('sdk/base/util/XmlParser');

/**
 * VAST Parser
 */
define(['dojo/_base/declare'], function (declare) {
  var vastParser = declare([], {
    constructor: function (target) {
      console.log('vastParser::constructor');

      this.target = target;
    },

    /**
     * Return the value of a tag in a defined XML.
     *
     * @param xmldata
     * @param tagName
     *
     */
    getTagValue: function (xmldata, tagName) {
      if (xmldata.getElementsByTagName(tagName).length == 0) return null;
      else return xmlParser.textContent(xmldata.getElementsByTagName(tagName)[0]);
    },

    /**
     * Return an array of childNodes in a defined XML node.
     *
     * @param xmldata
     * @param tagName
     * @param nodeName
     *
     */
    getDataAsArray: function (xmldata, tagName, nodeName) {
      if (xmldata.getElementsByTagName(tagName).length == 0) return null;

      var data = xmldata.getElementsByTagName(tagName)[0].childNodes;

      var array = [];

      for (var i = 0; i < data.length; i++) {
        if (data[i].nodeName == nodeName) array.push(xmlParser.textContent(data[i]));
      }
      return array;
    },

    trim: function (value) {
      if (value == undefined) return null;

      return value.replace(/^\s+|\s+$/g, '');
    }
  });

  return vastParser;
});
