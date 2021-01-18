# MinIDE, a minimal IDE based on CodeMirror

## demo: https://www.robosoft.de/MinIDE/test.htm
### config demo: https://www.robosoft.de/MinIDE/MinIDE/config.php

## usage:

- Simply copy the MinIDE folder into your project
- your index.htm should look like

```
<!doctype html>
<html>
<head>
  <title>MinIDE - the minimal IDE :-)</title>
  <meta charset="utf-8"/>

  <link rel=stylesheet href="MinIDE/lib/codemirror.css">
  <link rel=stylesheet href="MinIDE/doc/docs.css">
  <script src="MinIDE/lib/codemirror.js"></script>
  <script src="MinIDE/mode/xml/xml.js"></script>
  <script src="MinIDE/mode/javascript/javascript.js"></script>
  <script src="MinIDE/mode/css/css.js"></script>
  <script src="MinIDE/mode/htmlmixed/htmlmixed.js"></script>
  <script src="MinIDE/addon/edit/matchbrackets.js"></script>

  <link href="MinIDE/phpFileTree/styles/default/default.css" rel="stylesheet" type="text/css" media="screen" />
  <script src="MinIDE/phpFileTree/php_file_tree.js" type="text/javascript"></script>

  <script src="MinIDE/MinIDE.js"></script>
  <link rel=stylesheet href="MinIDE/MinIDE.css">
  <style>
    .CodeMirror { height: auto; border: 1px solid #ddd; }
    .CodeMirror-scroll { max-height: 80vh; }
    .CodeMirror pre { padding-left: 7px; line-height: 1.25; }
  </style>

</head>
<body>

<div id="IDE" style="height:80%;"></div>
    
<script>
var oIDE = new MinIDE("IDE");

function CallIDE(iAction,s)
{
  oIDE.CallIDE(iAction,s);
}
</script>

</body>
</html>
```

