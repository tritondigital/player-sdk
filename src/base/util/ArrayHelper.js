var _ = require("lodash");

module.exports = {
  toSafeArray: function (value) {
    if (value) {
      if (!_.isArray(value)) {
        return [value];
      }

      return value;
    }

    return [];
  },
};
