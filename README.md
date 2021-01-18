# MinIDE, a minimal IDE based on CodeMirror

## demo: https://www.robosoft.de/MinIDE/test.htm

- Simply copy the MinIDE folder into your project
- your index.htm should look like

```<!doctype html>
<html>
<head>
  <title>MinIDE - the minimal IDE :-)</title>
  <meta charset="utf-8"/>
 </head>
<body>
  <div id="IDE" style="height:80%;"></div>

  <script src="MinIDE/MinIDE.js"></script>
  <script>
    var oIDE = new MinIDE("IDE");
  </script>

  <a href="javascript:alert(oIDE.GetValue());">Compile</a>
</body>
</html>```

- the root folder, white list, etc. can be set in MinIDE/config.php

## config demo: https://www.robosoft.de/MinIDE/MinIDE/config.php (empty password)
