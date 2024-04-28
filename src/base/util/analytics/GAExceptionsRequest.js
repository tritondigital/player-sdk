/**
 *  @module GAExceptionRequest
 */
define(['dojo/_base/declare', 'sdk/base/util/analytics/GARequest'], function (declare, GARequest) {
  /**
   * @namespace tdapi/modules/analytics/GAEventRequest
   */
  var GAExceptionRequest = declare([GARequest], {
    /**
     * constructor
     */
    constructor: function () {
      console.log('GAExceptionRequest::constructor');

      this.inherited(arguments);
    }
  });

  //singleton
  if (this.GAExceptionRequestInstance == null) {
    this.GAExceptionRequestInstance = new GAExceptionRequest();
  }

  return this.GAExceptionRequestInstance;
});
