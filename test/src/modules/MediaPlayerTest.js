var expect = require("expect.js");
var MediaPlayer = require("sdk/modules/MediaPlayer");

describe("MediaPlayer", function () {
  var station, stationId, mount;

  beforeEach(function () {
    console.log = function () {};
    station = "12345";
    stationId = "123456";
    mount = "1234567";
  });

  describe("id sync", function () {
    it("should prioritize station query param for id sync ", function () {
      var config = {
        station: station,
        stationId: stationId,
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.not.contain(stationId);
      expect(query).to.contain(station);
    });

    it("should prioritize stationId query param over mount for id sync  ", function () {
      var config = {
        mount: mount,
        stationId: stationId,
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.not.contain(mount);
      expect(query).to.contain(stationId);
    });

    it("should return undefined when required param are not present  ", function () {
      var config = {
        hello: "hello",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.be(undefined);
    });

    it("should add age param when number between 1 and 125", function () {
      var config = {
        station: station,
        age: "125",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.contain(125);
    });

    it("should skip age param when number is greater than 1 and 125", function () {
      var config = {
        station: station,
        age: "126",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.not.contain("age");
    });

    it("should skip age param when age is not a number", function () {
      var config = {
        station: station,
        age: "hello",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.not.contain("age");
    });

    it("should add date of birth param when is a valid date format", function () {
      var config = {
        station: station,
        dob: "2017-12-11",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.contain("2017-12-11");
    });

    it("should convert mm/dd/yyy into yyyy-mm-dd", function () {
      var config = {
        station: station,
        dob: "12/11/2017",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.contain("2017-12-11");
    });

    it("should convert yyyy/mm/dd into yyyy-mm-dd", function () {
      var config = {
        station: station,
        dob: "2017/12/11",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.contain("2017-12-11");
    });

    it("should always display yyyy-mm-dd event on a month or day under 10", function () {
      var config = {
        station: station,
        dob: "2017/08/08",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.contain("2017-08-08");
    });

    it("should not add date of birth param when is a valid date format", function () {
      var config = {
        station: station,
        dob: "2017-12-12asdg",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.not.contain("dob");
    });

    it("should add year of birth param when is a number", function () {
      var config = {
        station: station,
        yob: "2015",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.contain("2015");
    });

    it("should not add year of birth param when is a valid date format", function () {
      var config = {
        station: station,
        dob: "sadg",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.not.contain("yob");
    });

    it("should add gender param when is a m or f or o string only", function () {
      var config = {
        station: station,
        gender: "m",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.contain("gender");
    });

    it("should add gender param when is a m or f or o string only", function () {
      var config = {
        station: station,
        gender: "o",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.contain("gender");
    });

    it("should not add gender param when is not a m or f string", function () {
      var config = {
        station: station,
        gender: "fs",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.not.contain("gender");
    });

    it("should add ip param when is valid ip pattern", function () {
      var config = {
        station: station,
        ip: "127.123.123.123",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.contain("ip");
    });

    it("should not add ip param when is not valid ip pattern", function () {
      var config = {
        station: station,
        ip: "127.12334.123.123",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.not.contain("ip");
    });

    it("should prioritize dob over age and year of birth", function () {
      var config = {
        station: station,
        yob: "1989",
        dob: "1945-11-24",
        age: "12",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.not.contain("yob");
      expect(query).to.not.contain("age");
      expect(query).to.contain("dob");
    });

    it("should prioritize year of birth over age", function () {
      var config = {
        station: station,
        yob: "1989",
        age: "12",
      };
      var mediaPlayer = new MediaPlayer(config, null);
      var query = mediaPlayer._getIdSyncQueryParam(config);
      expect(query).to.not.contain("age");
      expect(query).to.contain("yob");
    });
  });
});
