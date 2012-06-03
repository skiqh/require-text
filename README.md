Purpose
=======

with require-text, you can require simple text files within your couchdb show and list functions as well as on the client like this

> var tpl = require('lib/text').templates.html5


Usage
-----

add the dependency to your `kanso.json`.

```javascript
{
	...
	"dependencies": 
		{	...
		,	"require-text": null
		}
}
```

also in `kanso.json`, configure which files to read
```javascript

	...
	"require-text": 
		{	"paths": <path or path list>
		,	"strip_extensions": <true/false>
		,	"module": <module_name>
		}

```
Additional settings:
* `paths`: This can be `true` (meaning all files and folders), a single file,
a single folder, or a list of folders; all files in all subfolders will be read
(except hidden files).
* `strip_extensions`: Make `require-text` ignore file extensions by settings
the `strip_extensions` flag to `true` (defaults to false).
* `module`: Set the first part of the require parameter (see below)

Example
-------

Assuming we have the folowing file/folder structure,
```
	.
	|--kanso.json
	|--templates
	|       |--single.html
	|       `--list.html
	|
	|--index.html
	`--index.json

```

and the following settings in kanso.json

```javascript

	...
	"require-text": 
		{	"paths": [ "templates", "index.html", "index.json" ]
		,	"strip_extensions": true
		,	"module": "strings"
		}

```
If `strip_extensions` was set to `false`, we could access the contents of the
files via

> `var txt = require("strings/templates").single.html` or
> `var txt = require("strings/index").json`

But since it is `true`, these two lines actually are

> `var txt = require("strings/templates").single` and
> `var txt = require("strings/index")`

which makes our code just a little clearer.

```javascript
	{   service: function(doc, req)
		{
			var templates = require('text/templates')

			if (doc)
				return {
					"headers" : {"Content-Type" : "text/html"},
					"body" : templates.single
				}
			else
				return {
					"headers" : {"Content-Type" : "text/plain"},
					"body" : require('text/index')
				}
		}
	}
```

Note however, that after putting the contents of `index.html` into `"strings/index"`,
they are overwritten with the contents of `index.json`. require-text will warn
you about this though.


Sections
-------

`require-text` can split up files into smaller parts, making them available as subsections of the JSON-objects.
For example, the folowing text of file `templates/list.html` will yield `alpha`, `entry` and `omega`:

```html
---alpha---
html>
	<head>
		<link rel='stylesheet' href='/style.css' type='text/css'>
	</head>
	<body>
		<div id="main">

---entry---
			<a href="/{value._id}" class="entry">
				<span class="icon" style="background-position-x: -{value._icon_position}px"></span><span>{value._id}</span>
			</a>


---omega---
		</div>
	<script data-main="js/main" src="/js/require.js"></script>
	</body>
/html>
```
Just overwrite the blocks with `---section_name---` (a-z and underscore only at
the moment - but you can hack this with the `split_regex` setting) and delimit
the blocks by at least one empty line.

This is useful in `list` functions, so you can stream the head first, some
content from the database and then the footer in the end, while having only one
coherent file to maintain.


Extending the example above (and using
[json-template](https://github.com/Gozala/json-template)), we would write

```javascript
exports.lists = 
	{	all_services: function(head, req) 
		{
		var templates = require('strings/templates')
		var json_template = require('common/json-template')

		var tplEntry = json_template.Template(templates.list.entry)

		start({ "headers": { "Content-Type": "text/html" }	})
		send(templates.list.alpha)
		send(templates.menu)
		var row
			while (row = getRow()) {
				row.value._icon_position = (row.value.icon_index-1) * 32
				send(tplEntry.expand(row))
			}
		send(templates.list.omega)
		}
	}

```
