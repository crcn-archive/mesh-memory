var extend       = require("xtend/mutable");
var sift         = require("sift");
var protoclass   = require("protoclass");
var Writable     = require("obj-stream").Writable;

/**
 */

function _json(data) {
  return JSON.parse(JSON.stringify(data));
}

/**
 */

function MemoryDatabase(options) {
  if (!options) options = {};

  this.options    = options;
  this.idProperty = options.idProperty || "id";
  this.name       = options.name       || "memory";
  this.db         = {};
}

/**
 */

protoclass(MemoryDatabase, {

  /**
   */

  run: function(operation, onRun) {
    var method = this[operation.name];
    if (!method) return onRun();
    operation = extend({}, this.options, operation, operation[this.name] || {});
    if (!operation.collection) return onRun(new Error("collection must exist"));
    var self = this;
    method.call(this, this._collection(operation), operation, function() {
      onRun.apply(this, arguments);
    });
  },

  /**
   */

  insert: function(collection, options, onRun) {

    var newData = _json(options.data || {});

    if (Object.prototype.toString.call(newData) === "[object Array]") {
      collection.push.apply(collection, newData);
    } else {
      collection.push(newData);
    }

    onRun(void 0, newData);
  },

  /**
   */

  update: function(collection, options, onRun) {
    var items = sift(options.query, collection);
    var ret = items;

    if (options.multi) {
      for (var i = items.length; i--;) extend(items[i], options.data);
    } else {
      var item = items.shift();
      ret = item;
      if (item) extend(item, options.data);
    }

    onRun(void 0, ret);
  },

  /**
   */

  upsert: function(collection, options, onRun) {
    var self = this;
    this.update(collection, options, function(err, item) {
      if (item) return onRun(err, item);
      self.insert(collection, options, onRun);
    });
  },

  /**
   */

  remove: function(collection, options, onRun) {

    var items = sift(options.query, collection);
    var ret = items;

    if (options.multi) {
      for (var i = items.length; i--;) collection.splice(collection.indexOf(items[i]), 1);
    } else {
      var item = items.shift();
      ret = item;
      if (item) collection.splice(collection.indexOf(item), 1);
    }

    onRun(void 0, ret);
  },

  /**
   */

  load: function(collection, options, onRun) {
    var items = options.query ? sift(options.query, collection) : collection.concat();
    onRun(void 0, options.multi ? items : items.shift());
  },

  /**
   */

  _collection: function(options) {

    var collection;

    if ((collection = this.db[options.collection]) && (!collection.ttl || (Date.now() - collection.createdAt) < collection.ttl)) {
      return collection.data;
    }

    collection = this.db[options.collection] = {
      data: [],
      ttl: options.ttl,
      createdAt: Date.now()
    };


    return collection.data;
  }
});

/**
 */

module.exports = function(options) {
  return module.exports.getStreamer(MemoryDatabase)(options);
};

/**
 */

module.exports.getStreamer = function(clazz) {
  return function(options) {
    var db = new clazz(options);

    function ret (operation) {

      var stream = new Writable();

      process.nextTick(function() {
        db.run(operation, function(err, data) {
          if (err) stream.reader.emit("error", err);
          if (Object.prototype.toString.call(data) === "[object Array]") {
            data.forEach(function(item) {
              stream.write(item);
            });
          } else if (data) {
            stream.write(data);
          }
          stream.end();
        });
      });

      return stream.reader;
    }

    ret.target = db;
    return ret;
  };
};

/**
 */

module.exports.extend = function() {
  return MemoryDatabase.extend.apply(MemoryDatabase, arguments);
};
