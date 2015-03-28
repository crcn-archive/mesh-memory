var crudlet              = require("crudlet");
var memoryDatabase = require("..");
var sinon                = require("sinon");
var expect               = require("expect.js");

describe(__filename + "#", function() {

  xit("can proper defaults", function() {
    var db = memoryDatabase();
    expect(db.idProperty).to.be("id");
    expect(db.storageKey).to.be("crudlet-db");
  });

  it("can add memory specific options", function(next) {
    var db   = memoryDatabase({ collection: "words", storageKey: "abba" });
    var setStub = sinon.spy(db.target, "insert");
    crudlet.run(db, "insert", { memory: { a: 1}}).on("data", function() {
      expect(setStub.callCount).to.be(1);
      expect(setStub.firstCall.args[1].a).to.be(1);
    }).on("end", next);
  });

  it("can change the name of the memory specific options", function(next) {
    var db   = memoryDatabase({ name: "abba", collection: "words", storageKey: "abba" });
    var setStub = sinon.spy(db.target, "insert");
    crudlet.run(db, "insert", { abba: { a: 1}}).on("data", function() {
      expect(setStub.callCount).to.be(1);
      expect(setStub.firstCall.args[1].a).to.be(1);
    }).on("end", next);
  });

  it("returns an error if collection is not specified", function(next) {
    var db   = memoryDatabase();

    crudlet.run(db, "insert", { abba: { a: 1}}).on("error", function(err) {
      expect(err).not.to.be(void 0);
    }).on("data", function() { }).on("end", next);

  });

  it("can specify collection in constructor", function(next) {
    var db   = memoryDatabase({ collection: "words" });
    crudlet.run(db, "insert", { data: { name: "abba" }}).on("data", function(data) {
      expect(data.name).to.be("abba");
      next();
    });
  });

  it("can insert an item", function(next) {
    var db   = memoryDatabase({collection:"people"});
    crudlet.run(db, "insert", { data: { name: "abba" }}).on("data", function() {
      expect(db.target.db.people[0].name).to.be("abba");
      next();
    });
  });

  xit("emits willRun", function() {
    var db   = crudlet(memoryDatabase({collection:"people"}));
    var i = 0;
    db.target.on("willRun", function() { i++; });
    db.insert({ data: { name: "abba" }});
    expect(i).to.be(1);
  });

  xit("emits didRun", function() {
    var db   = crudlet(memoryDatabase({collection:"people"}));
    var i = 0;
    db.target.on("didRun", function() { i++; });
    db.insert({ data: { name: "abba" }});
    expect(i).to.be(1);
  });

  it("can insert multiple items at once", function(next) {
    var db   = memoryDatabase({collection:"people"});

    var items = [];

    crudlet.run(db, "insert", { data: [{ name: "abba" }, {name:"baab"}]}).on("data", function(data) {
      items.push(data);
    }).on("end", function() {
      expect(items.length).to.be(2);
      next();
    });
  });

  it("can update an item with a query", function(next) {
    var db   = memoryDatabase({collection:"people"});
    var stream = crudlet.stream(db).on("data", function() { }).on("end", function() {
      expect(db.target.db.people[0].name).to.be("baab");
      expect(db.target.db.people[1].name).to.be("abba");
      next();
    });

    stream.write(crudlet.operation("insert", { data: { name: "abba" }}));
    stream.write(crudlet.operation("insert", { data: { name: "abba" }}));
    stream.end(crudlet.operation("update", { query: { name: "abba" }, data: { name: "baab" }}));
  });

  it("can update multiple items with a query", function(next) {

    var db   = memoryDatabase({collection:"people"});
    var stream = crudlet.stream(db).on("data", function() { }).on("end", function() {
      expect(db.target.db.people[0].name).to.be("baab");
      expect(db.target.db.people[1].name).to.be("baab");
      next();
    });

    stream.write(crudlet.operation("insert", { data: { name: "abba" }}));
    stream.write(crudlet.operation("insert", { data: { name: "abba" }}));
    stream.end(crudlet.operation("update", { multi: true, query: { name: "abba" }, data: { name: "baab" }}));

  });

  it("can remove an item, and only one item", function(next) {

    var db   = memoryDatabase({collection:"people"});
    var stream = crudlet.stream(db).on("data", function() { }).on("end", function() {
      expect(db.target.db.people.length).to.be(1);
      next();
    });

    stream.write(crudlet.operation("insert", { data: { name: "abba" }}));
    stream.write(crudlet.operation("insert", { data: { name: "abba" }}));
    stream.end(crudlet.operation("remove", { query: { name: "abba" }}));
  });

  it("can remove multiple items", function(next) {
    var db   = memoryDatabase({collection:"people"});
    var stream = crudlet.stream(db).on("data", function() { }).on("end", function() {
      expect(db.target.db.people.length).to.be(0);
      next();
    });

    stream.write(crudlet.operation("insert", { data: { name: "abba" }}));
    stream.write(crudlet.operation("insert", { data: { name: "abba" }}));
    stream.end(crudlet.operation("remove", { multi: true, query: { name: "abba" }}));
  });

  it("can load one item", function(next) {

    var db   = memoryDatabase({collection:"people"});
    var items = [];
    var stream = crudlet.stream(db);
    stream.write(crudlet.operation("insert", { data: { name: "abba" }}));
    stream.end(crudlet.operation("insert", { data: { name: "abba" }}));

    stream = crudlet.stream(db);
    stream.on("data", function(data) {
      items.push(data);
    }).on("end", function() {
      expect(items.length).to.be(1);
      next();
    });

    stream.end(crudlet.operation("load", { query: { name: "abba" }}));

  });

  it("can load multiple items", function(next) {
    var db   = memoryDatabase({collection:"people"});
    var items = [];
    var stream = crudlet.stream(db);
    stream.write(crudlet.operation("insert", { data: { name: "abba" }}));
    stream.end(crudlet.operation("insert", { data: { name: "abba" }}));

    stream = crudlet.stream(db);
    stream.on("data", function(data) {
      items.push(data);
    }).on("end", function() {
      expect(items.length).to.be(2);
      next();
    });

    stream.end(crudlet.operation("load", { multi: true, query: { name: "abba" }}));
  });
});
