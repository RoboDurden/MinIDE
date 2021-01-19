<center>this is the homepage set in config.php :-) 
<h1>MinIDE, a minimal IDE based on CodeMirror</h1>
</center>
<h2>demo: <a href="https://www.robosoft.de/MinIDE/test.htm" rel="nofollow">https://www.robosoft.de/MinIDE/test.htm</a></h2>

<ul>
	<li>Simply copy the MinIDE folder into your project</li>
	<li>your index.htm should look like</li>
</ul>

<pre>
<code>&lt;html&gt;
&lt;head&gt;
  &lt;title&gt;MinIDE - the minimal IDE :-)&lt;/title&gt;
  &lt;meta charset="utf-8"/&gt;
 &lt;/head&gt;
&lt;body&gt;
  &lt;div id="IDE" style="width:90vw;height:80vh;border:1px solid grey;"&gt;&lt;/div&gt;

  &lt;script src="MinIDE/MinIDE.js"&gt;&lt;/script&gt;
  &lt;script&gt;
    var oIDE = new MinIDE("IDE");
  &lt;/script&gt;

  &lt;a href="javascript:alert(oIDE.GetValue());"&gt;Compile&lt;/a&gt;
&lt;/body&gt;
&lt;/html&gt;
</code></pre>

<ul>
	<li>
	<p>the width and height of the container must be specified in absolute browser width/height percentage vw/vh :-(</p>
	</li>
	<li>
	<p>the root folder, white list, etc. can be set in MinIDE/config.php</p>
	</li>
</ul>

<h2>config demo: <a href="https://www.robosoft.de/MinIDE/MinIDE/config.php" rel="nofollow">https://www.robosoft.de/MinIDE/MinIDE/config.php</a> (empty password)</h2>
