var extend       = require("deep-extend");
var sift         = require("sift");
var EventEmitter = require("fast-event-emitter");
var protoclass   = require("protoclass");

/**
 */

function _json(data) {
  return JSON.parse(JSON.stringify(data));
}

/**
 */

function MemoryDatabase(options) {
  EventEmitter.call(this);
  if (!options) options = {};

  this.options    = options;
  this.idProperty = options.idProperty || "id";
  this.storageKey = options.storageKey || "crudlet-db";
  this.name       = options.name       || "memory";
  this.db         = {};
}

/**
 */

protoclass(EventEmitter, MemoryDatabase, {

  /**
   */

  run: function(operation, options, onRun) {
    var method = this[operation];
    if (!method) return onRun();
    options = extend({}, this.options, options, options[this.name] || {});
    if (!options.collection) return onRun(new Error("collection must exist"));
    var self = this;
    this.emit("willRun", options);
    method.call(this, this._collection(options), options, function() {
      self.emit("didRun", options);
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
      ret = items;
      if (item) extend(item, options.data);
    }

    onRun(void 0, ret);
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
      ret = items;
      if (item) collection.splice(collection.indexOf(item), 1);
    }

    onRun(void 0, ret);
  },

  /**
   */

  load: function(collection, options, onRun) {
    var items = sift(options.query, collection);
    onRun(void 0, options.multi ? items : items.shift());
  },

  /**
   */

  _collection: function(options) {
    return this.db[options.collection] || (this.db[options.collection] = []);
  }
});

/**
 */

module.exports = function(options) {
  return new MemoryDatabase(options);
};
