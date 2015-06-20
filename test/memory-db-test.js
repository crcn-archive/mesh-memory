var mesh            = require("mesh");
var memoryDatabase  = require("..");
var sinon           = require("sinon");
var expect          = require("expect.js");
var _               = require("highland");
var createTestCases = require("mesh/test-cases/database");

describe(__filename + "#", function() {

  var cases = createTestCases(memoryDatabase);

  for (var name in cases) it(name, cases[name]);


  it("can add memory specific options", function(next) {
    var db   = memoryDatabase({ collection: "words", storageKey: "abba" });
    var setStub = sinon.spy(db.target, "insert");

    db("insert", { memory: { a: 1}}).on("data", function() {
      expect(setStub.callCount).to.be(1);
      expect(setStub.firstCall.args[1].a).to.be(1);
    }).on("end", next);
  });

  it("can change the name of the memory specific options", function(next) {
    var db   = memoryDatabase({ name: "abba", collection: "words" });
    var setStub = sinon.spy(db.target, "insert");
    db({ name: "insert", abba: { a: 1}}).on("data", function() {
      expect(setStub.callCount).to.be(1);
      expect(setStub.firstCall.args[1].a).to.be(1);
    }).on("end", next);
  });

  it("can add a TTL to a database collection", function(next) {
    var db = memoryDatabase();
    db({ name: "insert", collection: "people", ttl: 1, data: { name: "abba" }}).on("data", function() {
      setTimeout(function() {
        db({ name: "load", collection: "people" }).pipe(_.pipeline(_.collect)).on("data", function(items) {
          expect(items.length).to.be(0);
          next();
        });
      }, 5);
    });
  });

  it("can add a TTL in the constructor", function(next) {
    var db = memoryDatabase({ttl:1});
    db(mesh.op("insert", { collection: "people", data: { name: "abba" }})).on("data", function() {
      setTimeout(function() {
        db({ name: "load", collection: "people" }).pipe(_.pipeline(_.collect)).on("data", function(items) {
          expect(items.length).to.be(0);
          next();
        });
      }, 5);
    });
  });
});
