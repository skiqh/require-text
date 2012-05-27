Purpose
=======

with require-text, you can require simple text files within your couchdb show and list functions as well as on the client like this

> var tpl = require('lib/text').templates.html5


Usage
-----

add the dependency to your `kanso.json` (require-text needs the `modules` package);
the `"modules": ["lib"]` part is the important part when you require text later.

```javascript
{
	"modules": ["lib"],
	...
	"dependencies": 
		{	...
		,	"require-text": null
		,	"modules": null
		}
}
```

also in `kanso.json`, set the paths to include
```javascript

	...
	"require-text": 
		{	"paths": <path(s)>
		,	"strip_extensions": false
		}

```
where `<paths>` can be a a single file, a single folder, or a list of folders where all files in the subfolders get included.
You can make `require-text` ignore the file extensions by settings the `strip_extensions` flag to `true` (defaults to false).


Example
-------

Say we have a file `./templates/menu.html` ('.' relative to `kanso.json`). We configure `require-text` to include it like this:
```javascript

	...
	"require-text": 
		{	"paths": [ 'templates/menu.html' ]
		,	"strip_extensions": true
		}

```
As we ommit the extension, we can access the text on the client and on the server by requirering the `text` module like this:

```javascript
exports.shows = 
	{	service: function(doc, req)
		{	
			var menu = require('lib/text').templates.menu

		    if (doc)
				return {
					"headers" : {"Content-Type" : "text/html"},
					"body" : "<html>" + menu + "<p>" + doc.description + "</p></html>"
				}
			else
				return {
					"headers" : {"Content-Type" : "text/plain"},
					"body" : 'no doc'
				}
		}
	}	

```

Extras
-------

`require-text` can split up files into smaller parts, making them available as subsections of the JSON-objects.
For example, the folowing text of file `templates/list.html` will yield `alpha`, `entry` and `omega`:

```html
---alpha---
<html>
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
</html>
```
The syntax is pretty simple, just overwrite the blocks with their name, surrounded with three dashes on each side and delimit the blocks by at least one empty line.
This is useful in `list` functions, as you can stream the head first, some content from the database and the footer in the end, while having only one coherent file to maintain. Extending the example above (and using [json-template](https://github.com/Gozala/json-template) ), we would write

```javascript
exports.lists = 
	{	all_services: function(head, req) 
		{
		var templates = require('common/text').templates
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
