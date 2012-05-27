

var utils = require('kanso-utils/utils');
var precompiler = require('kanso-precompiler-base');
var path = require('path')
var fs = require('fs')



module.exports = 
	{	after: "modules"
	,	run: function (root, dir, settings, doc, callback) {
			if (!settings["require-text"]) {
				console.log("No require-text settings found");
				return callback(null, doc);
			}

			var results = '';
			var results_obj = {}

			var _ref = settings["require-text"]
			_ref.root = _ref.root || 'text'
			doc[_ref.root] = {}


			if (_ref.paths === true) {
					_ref.paths = ['.']; // "true" means the current directory and everything under it
			} else {
					_ref.paths = _ref.paths || [];
			}
			if (!Array.isArray(_ref.paths)) {
					_ref.paths = [ _ref.paths ];
			}

			collectPaths(_ref.paths, root, function(err, paths) {
				if (err) {
					callback(err);
				} else {
					
					async.forEach(paths, function(p, cb) {
						var txt = fs.readFileSync(p, 'utf-8')
						var name = path.relative('.', p)
						var exp = ''
						if (_ref.strip_extensions && (ext = path.extname(name)) !== '' ) {
							name = name.substring(0, name.length-ext.length) // utils.relpath(p, path)
						} else {
							name = name.substring(0, name.length-ext.length) + '/' + ext.substring(1)
						}
						var parts = name.split('/')
						var parts_ = []
						for (var depth=0; depth<parts.length; depth++) {
							parts_.push(parts[depth])
							var part = parts_.join("']['")
							if (typeof results_obj[part] === 'undefined') {
								results += "exports['" + part + "'] = {};\r\n"
								results_obj[part] = {}
							}
						}
												
						var split_regex = /---([a-z]+)---\r\n([\s\S]*?)(\r\n\r\n|$)/gi
						if (txt.search(split_regex) >= 0) {
							// results += ";\r\nexports['" + name + "'] = ''\r\n"
							results += txt.replace(split_regex, function( txt, $1, $2) {
								var exp = name + '/' + $1
								return "exports['" + exp.split('/').join("']['") + "'] = " + JSON.stringify($2) + ";\r\n"
							})
						} else {
							results += "exports['" + name.split('/').join("']['") + "'] = " + JSON.stringify(txt) + ";\r\n"

						}
						cb()
					}
					,	function (err) {
							if (err) {
								callback(err, doc);
							} else {
								precompiler.addModule(doc, 'common/'+_ref.root, null, results);
								callback(null, doc)
							}
					});
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
				console.log("hidden file", p);
				cb();
			} else {
				p = path.resolve(root, p);
				fs.stat(p, function(err, stats) {
					if (err) {
						if (err.code === 'ENOENT') {
							cb();
						} else {
							cb(err);
						}
					} else {
						p = path.resolve(root, p);
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