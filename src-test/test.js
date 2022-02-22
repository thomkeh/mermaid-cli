"use strict"

const pkg = require("../src/index.js")
let { mmd2svg } = pkg

const diagram = `
graph TD
  A((A))
  B((B))
  A --> B`;

(async function(){
  const svg = await mmd2svg(diagram, {}, {}, "", {})
  console.log(svg)
})();
