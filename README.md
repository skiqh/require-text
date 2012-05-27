Purpose
=======

with require-text, you can require simple text files within your couchdb show and list functions like this

> var tpl = require('lib/text').templates.base


Usage
-----

add the dependency to your `kanso.json` (require-text needs the `modules` package);
set  

```javascript
{
	"modules": ["common"],
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
		}

```
where `<paths>` can be a a single file, a single folder, a list of folders where all files in the subfolders get included.
You can make require-text ignore the file extensions by settings the `strip_extensions` flag to `true`.


Goodies
-------

require-text can split up files into smaller parts, making them available as subsections of the JSON-objects.
For example, the folowing text will yield two sections, `alpha` and `omega`:

```html
---alpha---
<html>
	<head>
		<link rel='stylesheet' href='/style.css' type='text/css'>
	</head>
	<body>


---omega---
<script data-main="js/main" src="/js/require.js"></script>
</body>
</html>
```