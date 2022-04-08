const parser = require('xml-js')

let string = require('fs').readFileSync('./data.xml')

let obj = parser.xml2js(string)

console.log(JSON.stringify(obj))
