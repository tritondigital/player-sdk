/**
 * @module base/CoreModule
 *
 * @desc
 * The CoreModule is the base class of all modules in the api.
 */

define(['dojo/_base/declare', 'dojo/on'], function (declare, on) {
  var module = declare([], {
    //Internal Api requests
    INTERNAL_REQUEST_API_FUNCTIONS: {
      'get-alternate-content': '_onApiRequestGetAlternateContent',
      'get-vast-instream': '_onApiRequestGetVastInstream'
    },

    constructor: function (config, target) {
      console.log('coreModule::constructor');

      this.config = config;
      this.target = target;
    },

    /**
     * Emit an event on the player targetNode (internal use only)
     * @param {string} eventName
     * @param {object} data
     * @param {dom element} targetNode optional, is defined in case of multi instances of a player in the page
     *
     * @ignore
     */
    emit: function (eventName, data, targetNode) {
      if (targetNode && this.config.playerId != targetNode.id) return;

      console.log('coreModule::emit -->->-> eventName=' + eventName);

      on.emit(this.target, eventName, { data: data, bubbles: true, cancelable: true });
    }
  });

  return module;
});
