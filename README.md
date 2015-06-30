[![Build Status](https://travis-ci.org/mojo-js/mesh-memory.svg)](https://travis-ci.org/mojo-js/mesh-memory) [![Coverage Status](https://coveralls.io/repos/mojo-js/mesh-memory/badge.svg?branch=master)](https://coveralls.io/r/mojo-js/mesh-memory?branch=master) [![Dependency Status](https://david-dm.org/mojo-js/mesh-memory.svg)](https://david-dm.org/mojo-js/mesh-memory)

in-memory adapter for [mesh](https://github.com/mojo-js/mesh.js). Additional docs can be viewed here: http://meshjs.herokuapp.com/docs/database-adapters.

#### installation

```
npm install mesh-memory
```

Basuc usage:

```javascript
var mesh = require("mesh");
var memorydb = require("mesh-memory");

var db = memorydb();
db(mesh.op("insert", { data: { name: "blarg"}})).on("data", function() {

});

```
