

var utils = require('kanso-utils/utils');
var precompiler = require('kanso-precompiler-base');
	// var fs = require("fs");
var path = require('path')
var fs = require('fs')



module.exports = 
	{	after: "modules"
	,	run: function (root, path, settings, doc, callback) {
			if (!settings["require-text"]) {
				console.log("No require-text settings found");
				return callback(null, doc);
			}

			var results = '';
			var _ref = settings["require-text"]
			doc[_ref.root || 'require-text'] = {}


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
					// console.log(paths);
					
			
					async.forEach(paths, function(p, cb) {
						var txt = JSON.stringify(fs.readFileSync(p, 'utf-8')) //.replace(/[\r\n]+/gi, '\\\r\n')
						var name = p.split('/').pop().split('.', 1)[0] // utils.relpath(p, path)
						// console.log(path, name, p)
						// doc[_ref.root][name] = txt
						results += 'exports["' + name + '"] = ' + txt + ';\r\n'
						cb()
						// var name = utils.relpath(p.replace(/\.jade$/, '.html'), path)
						// ,	filename = utils.abspath(p, path)

						// compileJade(path, filename, settings, function (err, css) {
						// 		if (err) {
						// 				return cb(err);
						// 		}
						// 		doc._attachments[name] = {
						// 				content_type: 'text/html',
						// 				data: new Buffer(css).toString('base64')
						// 		};
						// 		cb();
						// });
					}
					,	function (err) {
							if (err) {
								callback(err, doc);
							} else {
								precompiler.addModule(doc, 'common/'+_ref.root, _ref.root, results);
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
						} else /* if (/\.jade$/.test(p)) */{
								results.push(p);
								cb();
						} /*else {
								cb(); // this file isn't a jade file so don't precompile it
						}*/
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