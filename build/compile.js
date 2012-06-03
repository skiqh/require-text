

var utils = require('kanso-utils/utils');
var precompiler = require('kanso-precompiler-base');
var pathlib = require('path')
var fs = require('fs')

addPropertyRec = function(obj, keys, value, _keys) {
	if (keys.length === 0) {
		throw new Error("Cannot set undefined key")
	}
	if (keys.length === 1) {
		if ( typeof obj[keys[0]] !== 'undefined')
			console.warn("[require-text] WARNING overwriting key '%s'", keys[0])
		obj[keys[0]] = value
	} else {
		var key = keys.shift()
		obj[key] = obj[key] || {}
		addPropertyRec( obj[key], keys, value, _keys )
	}
	return obj
}
module.exports = 
	{	after: "modules"
	,	run: function (root, dir, settings, doc, callback) {
			if (!settings["require-text"]) {
				console.log("No require-text settings found");
				return callback(null, doc);
			}

			
			var results_obj = {}

			var conf = settings["require-text"]
			conf.module = conf.module || 'text'

			if (conf.paths === true) {
					conf.paths = ['.']; // "true" means the current directory and everything under it
			} else {
					conf.paths = conf.paths || [];
			}
			if (!Array.isArray(conf.paths)) {
					conf.paths = [ conf.paths ];
			}

			if (conf.split_regex && typeof conf.split_regex === 'string')
				new RegExp(conf.split_regex, "gi")
			else
				conf.split_regex = /---([a-z_]+)---[\r\n]+([\s\S]*?)(\r\n\r\n|\n\n|$)/gi

			collectPaths(conf.paths, root, function(err, paths) {
				if (err) {
					callback(err, doc);
				} else {
					
					var add_modules = {};
					paths.forEach( function(path) {
						var add_module = {}

						var txt = fs.readFileSync(path, 'utf-8')
						var name = pathlib.relative('.', path)
						var ext = pathlib.extname(name)

						if (conf.strip_extensions && ext !== '' ) {
							name = name.substring(0, name.length-ext.length)
						} else {
							name = name.substring(0, name.length-ext.length) + '/' + ext.substring(1)
						}

						var parts = name.split('/')
						var module_name = parts.shift()
						
						var res
						if (txt.search(conf.split_regex) >= 0) {
							res = {}
							while( (match=conf.split_regex.exec(txt)) != null ) {
								res[match[1]] = match[2]
							}
						} else {
							res = txt
						}
						if (parts.length > 0) {
							add_modules[module_name] = addPropertyRec(add_modules[module_name] || {}, parts, res)
						} else {
							if ( typeof add_modules[module_name] !== 'undefined')
								console.warn("[require-text] WARNING overwriting key '%s'", module_name)

							add_modules[module_name] = res
						}
					})
					for (var module_name in add_modules) {
						precompiler.addModule(doc, conf.module + '/' + module_name, null, "module.exports = " + JSON.stringify(add_modules[module_name]))
					}
					callback(null, doc)
				}
			})
		}
	}


function collectPaths(paths, root, callback) {
		var results = [];
		if (paths === true) {
				paths = ['.']; // "true" means the current directory and everything under it
		} else {
				paths = paths || [];
		}
		if (!Array.isArray(paths)) {
				paths = [ paths ];
		}

		async.forEach(paths, function(p, cb) {
			if (/^\.[^.]|~$/.test(p)) { // ignore hidden files
				console.log("ignoring hidden file '%s'", p);
				cb();
			} else {
				p = pathlib.resolve(root, p);
				fs.stat(p, function(err, stats) {
					if (err) {
						if (err.code === 'ENOENT') {
							cb();
						} else {
							cb(err);
						}
					} else {
						p = pathlib.resolve(root, p);
						if (stats.isDirectory()) {
							fs.readdir(p, function(err, files) {
								if (err) {
										cb(err);
								} else {
									collectPaths(files, p, function(err, subresults) {
										results = results.concat(subresults);
										cb(); // have visited all of this directory
									});
								}
							});
						} else {
								results.push(p);
								cb();
						}
					}
				});
			}
		},
		function(err) {
				if (err) {
						callback(err);
				} else {
						callback(null, results);
				}
		});
}