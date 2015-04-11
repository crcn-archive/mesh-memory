var mesh              = require("mesh");
var memoryDatabase       = require("..");
var sinon                = require("sinon");
var expect               = require("expect.js");
var _                    = require("highland");
var createTestCases      = require("mesh-store-test-cases");

describe(__filename + "#", function() {

  var cases = createTestCases(memoryDatabase);
  for (var name in cases) it(name, cases[name]);

  xit("can proper defaults", function() {
    var db = memoryDatabase();
    expect(db.idProperty).to.be("id");
    expect(db.storageKey).to.be("mesh-db");
  });

  it("can add memory specific options", function(next) {
    var db   = memoryDatabase({ collection: "words", storageKey: "abba" });
    var setStub = sinon.spy(db.target, "insert");

    db("insert", { memory: { a: 1}}).on("data", function() {
      expect(setStub.callCount).to.be(1);
      expect(setStub.firstCall.args[1].a).to.be(1);
    }).on("end", next);
  });

  it("can change the name of the memory specific options", function(next) {
    var db   = memoryDatabase({ name: "abba", collection: "words", storageKey: "abba" });
    var setStub = sinon.spy(db.target, "insert");
    mesh.clean(db)("insert", { abba: { a: 1}}).on("data", function() {
      expect(setStub.callCount).to.be(1);
      expect(setStub.firstCall.args[1].a).to.be(1);
    }).on("end", next);
  });

  it("returns an error if collection is not specified", function(next) {
    var db   = mesh.clean(memoryDatabase());

    db("insert", { abba: { a: 1}}).on("error", function(err) {
      expect(err).not.to.be(void 0);
    }).on("data", function() { }).on("end", next);

  });

  it("can specify collection in constructor", function(next) {
    var db   = mesh.clean(memoryDatabase({ collection: "words" }));
    db("insert", { data: { name: "abba" }}).on("data", function(data) {
      expect(data.name).to.be("abba");
      next();
    });
  });

  it("load doesn't have to emit data", function(next) {
    var i = 0;
    var db   = mesh.child(memoryDatabase(), { collection: "people" });
    db("load").on("data", function(data) {
      i++;
    }).on("end", function() {
      expect(i).to.be(0);
      next();
    });
  });

  it("can add a TTL to a database collection", function(next) {
    var db = mesh.child(memoryDatabase(), { collection: "people", ttl: 1 });
    db(mesh.op("insert", { data: { name: "abba" }})).on("data", function() {
      setTimeout(function() {
        db(mesh.op("load")).pipe(_.pipeline(_.collect)).on("data", function(items) {
          expect(items.length).to.be(0);
          next();
        });
      }, 5);
    });
  });

  it("can add a TTL in the constructor", function(next) {
    var db = mesh.child(memoryDatabase({ttl:1}), { collection: "people" });
    db(mesh.op("insert", { data: { name: "abba" }})).on("data", function() {
      setTimeout(function() {
        db(mesh.op("load")).pipe(_.pipeline(_.collect)).on("data", function(items) {
          expect(items.length).to.be(0);
          next();
        });
      }, 5);
    });
  });
});
