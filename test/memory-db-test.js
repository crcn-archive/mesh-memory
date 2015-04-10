var mesh              = require("mesh");
var memoryDatabase       = require("..");
var sinon                = require("sinon");
var expect               = require("expect.js");
var _                    = require("highland");

describe(__filename + "#", function() {

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

  it("can insert an item", function(next) {
    var db   = memoryDatabase({collection:"people"});
    mesh.clean(db)("insert", { data: { name: "abba" }}).on("data", function() {
      expect(db.target.db.people.data[0].name).to.be("abba");
      next();
    });
  });

  it("can insert multiple items at once", function(next) {
    var db   = memoryDatabase({collection:"people"});

    var items = [];

    mesh.clean(db)("insert", { data: [{ name: "abba" }, {name:"baab"}]}).on("data", function(data) {
      items.push(data);
    }).on("end", function() {
      expect(items.length).to.be(2);
      next();
    });
  });

  it("can update an item with a query", function(next) {
    var db   = memoryDatabase({collection:"people"});
    var stream = mesh.open(db).on("data", function() { }).on("end", function() {
      expect(db.target.db.people.data[0].name).to.be("baab");
      expect(db.target.db.people.data[1].name).to.be("abba");
      next();
    });

    stream.write(mesh.operation("insert", { data: { name: "abba" }}));
    stream.write(mesh.operation("insert", { data: { name: "abba" }}));
    stream.end(mesh.operation("update", { query: { name: "abba" }, data: { name: "baab" }}));
  });

  it("can update multiple items with a query", function(next) {

    var db   = memoryDatabase({collection:"people"});
    var stream = mesh.open(db).on("data", function() { }).on("end", function() {
      expect(db.target.db.people.data[0].name).to.be("baab");
      expect(db.target.db.people.data[1].name).to.be("baab");
      next();
    });

    stream.write(mesh.operation("insert", { data: { name: "abba" }}));
    stream.write(mesh.operation("insert", { data: { name: "abba" }}));
    stream.end(mesh.operation("update", { multi: true, query: { name: "abba" }, data: { name: "baab" }}));

  });

  it("can remove an item, and only one item", function(next) {

    var db   = memoryDatabase({collection:"people"});
    var stream = mesh.stream(db).on("data", function() { }).on("end", function() {
      expect(db.target.db.people.data.length).to.be(1);
      next();
    });

    stream.write(mesh.operation("insert", { data: { name: "abba" }}));
    stream.write(mesh.operation("insert", { data: { name: "abba" }}));
    stream.end(mesh.operation("remove", { query: { name: "abba" }}));
  });

  it("can remove multiple items", function(next) {
    var db   = memoryDatabase({collection:"people"});
    var stream = mesh.stream(db).on("data", function() { }).on("end", function() {
      expect(db.target.db.people.data.length).to.be(0);
      next();
    });

    stream.write(mesh.operation("insert", { data: { name: "abba" }}));
    stream.write(mesh.operation("insert", { data: { name: "abba" }}));
    stream.end(mesh.operation("remove", { multi: true, query: { name: "abba" }}));
  });

  it("can load one item", function(next) {

    var db   = memoryDatabase({collection:"people"});
    var items = [];
    var stream = mesh.stream(db);
    stream.write(mesh.operation("insert", { data: { name: "abba" }}));
    stream.end(mesh.operation("insert", { data: { name: "abba" }}));

    stream = mesh.stream(db);
    stream.on("data", function(data) {
      items.push(data);
    }).on("end", function() {
      expect(items.length).to.be(1);
      next();
    });

    stream.end(mesh.operation("load", { query: { name: "abba" }}));

  });

  it("can use the idProperty from data in load if query is undefined", function(next) {

    var db   = memoryDatabase({collection:"people", idProperty: "_id" });

    db(mesh.op("insert", {
      data: [
        { _id: "m1", text: "a" },
        { _id: "m2", text: "b" },
        { _id: "m3", text: "c" }
      ]
    })).on("end", function() {
      db(mesh.op("load", {
        data: { _id: "m2", text: "do-not-query-this" }
      })).on("data", function(data) {
        expect(data._id).to.be("m2");
        expect(data.text).to.be("b");
        next();
      });
    });
  });

  it("can load multiple items", function(next) {
    var db   = memoryDatabase({collection:"people"});
    var items = [];
    var stream = mesh.open(db);
    stream.write(mesh.operation("insert", { data: { name: "abba" }}));

    stream.on("data", function() { });
    stream.on("end", function() {
      stream = mesh.open(db);
      stream.on("data", function(data) {
        items.push(data);
      }).on("end", function() {
        expect(items.length).to.be(2);
        next();
      });

      stream.end(mesh.operation("load", { multi: true, query: { name: "abba" }}));
    });

    stream.end(mesh.operation("insert", { data: { name: "abba" }}));
  });

  it("can load all items", function(next) {
    var db   = memoryDatabase();
    var items = [];
    var stream = mesh.stream(db);
    stream.write(mesh.operation("insert", { collection:"people", data: { name: "abba" }}));
    stream.on("data", function() { });
    stream.on("end", function() {
      stream = mesh.stream(db);
      stream.on("data", function(data) {
        items.push(data);
      }).on("end", function() {
        expect(items.length).to.be(2);
        next();
      });

      stream.end(mesh.operation("load", { multi: true, collection:"people" }));
    });
    stream.end(mesh.operation("insert", { collection:"people", data: { name: "abba" }}));

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

  it("can upsert & insert an item", function(next) {
    var db   = mesh.child(memoryDatabase(), { collection: "people" });
    mesh.clean(db)("upsert", { data: { name: "abba"}, query: { name: "abba"}}).on("data", function() {
      mesh.clean(db)("load", { query: { name: "abba" }}).on("data", function(data) {
        expect(data.name).to.be("abba");
        next();
      });
    });
  });

  it("can upsert & update an item", function(next) {
    var db   = mesh.clean(mesh.child(memoryDatabase(), { collection: "people" }));
    db("upsert", { data: { name: "abba"}, query: { name: "abba"}}).on("data", function() {
      db("upsert", { data: { age: 99 }, query: { name: "abba"}}).on("data", function() {
        db("load", { query: { name: "abba" }}).on("data", function(data) {
          expect(data.name).to.be("abba");
          expect(data.age).to.be(99);
          next();
        });
      });
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
