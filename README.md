[![Build Status](https://travis-ci.org/crcn/crudlet-memory.svg)](https://travis-ci.org/crcn/crudlet-memory) [![Coverage Status](https://coveralls.io/repos/crcn/crudlet-memory/badge.svg?branch=master)](https://coveralls.io/r/crcn/crudlet-memory?branch=master) [![Dependency Status](https://david-dm.org/crcn/crudlet-memory.svg)](https://david-dm.org/crcn/crudlet-memory)

in-memory adapter for [crudlet](https://github.com/crcn/crudlet.js) - a library that makes it easy to persist data through multiple transports.

#### installation

```
npm install crudlet-memory
```

```javascript
var crudlet = require("crudlet");
var memorydb = require("crudlet-memory");

var db = memorydb();
db("insert", { data: { name: "blarg"}}).on("data", function() {

});

// streaming operations
crudlet.
open(db).
write(crudlet.operation("insert", { data: { name: "abba"}})).
end(crudlet.operation("remove", { query: { name: "abba"}}));
```

#### db memorydb(options)

creates a local crudelt database

- `options` - options for the local db
  - `name` - name of db (optional)
  - `store` - store to use

runs an operation

- `operation` - operation to run can be: `insert`, `remove`, `update`, or `load`
- `options` - operation specific options

insert options:

- `data` - data to insert. Can be an object, or an array to insert multiple

remove options:

- `query` - mongodb search query
- `multi` - TRUE if you want to remove multiple items (false by default)

update options:

- `query` - mongodb search query
- `multi` - TRUE if you want to update multiple items (false by default)
- `data` - data to set - this is merged with existing data

load options:

- `query` - mongodb search query
- `multi` - TRUE if you want to load multiple items (one by default)
