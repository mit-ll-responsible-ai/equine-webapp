// Copyright (c) 2023 Massachusetts Institute of Technology
// SPDX-License-Identifier: MIT
const fs = require("fs")
const path = require("path")

const config = {
  headerComments: `// Copyright (c) 2023 Massachusetts Institute of Technology
  // SPDX-License-Identifier: MIT
  `,
  searchDirectories: ['src'],
  searchExtensions: ["js","jsx","ts","tsx","css","scss"],
  stripExistingHeaders: true
}


// modified from from https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
function walk(dir, extensions, done) {
  let results = []
  fs.readdir(dir, function(err, list) {
    if (err) return done(err)
    let pending = list.length
    if (!pending) return done(null, results)
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, extensions, function(err, res) {
            results = results.concat(res)
            if (!--pending) done(null, results)
          })
        } else {
          if(extensions.includes(file.split(".").at(-1))) {
            results.push(file)
          }
          if (!--pending) done(null, results)
        }
      })
    })
  })
}

for(const dir of config.searchDirectories) {
  walk(dir, config.searchExtensions, function(err, results) {
    if(err) return console.error(err)
    
    results.forEach(filePath => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return console.error(err)
        console.log(data)
      })
    })
  })
}
