
var loadJS = function(url, rObject,rCallback){
    var aM = url.match(/\.([^.]+)$/);
    let sExt = aM[1].toLowerCase();

    var scriptTag;
    switch (sExt)
    {
    case "js":
        scriptTag = document.createElement("script");
        scriptTag.type = "text/javascript";
        scriptTag.src = url;
        break;
    case "css":
        scriptTag = document.createElement("link");
        scriptTag.rel = "stylesheet";
        scriptTag.type = "text/css";
        scriptTag.media="screen";
        scriptTag.href = url;
        break;
    }

    scriptTag.rObject = rObject;
    scriptTag.rCallback = rCallback;

    scriptTag.onerror = function(){alert(url + " not found -> aboarting MinIDE :-(")};
    if (rCallback)
    {
        scriptTag.onload = function(){
            this.rObject[rCallback]();
        };
    }

    document.body.appendChild(scriptTag);
};

function File(sPath,sValue)
{
    this.m_sPath = sPath;
    this.m_sValue = sValue;
    //this.m_sValueOrg = "";
    this.m_bChanged = false;

    this.GetFormat = function()
    {with(this){
        var aM = m_sPath.match(/\.([^.]+)$/);
        if (aM)
        {
            let sExt = aM[1].toLowerCase();
            var h = {"js":"text/javascript", "c":"text/x-csrc", "h":"text/x-csrc", "css":"text/css", "htm":"text/html", "html":"text/html", "php":"application/x-httpd-php"};
            if (h[sExt])
                return h[sExt];
        }
        return "text/plain";
    }}

    this.GetHtmlTab = function(iId,bActive)
    {with(this){
        let i = m_sPath.indexOf("../");
        let s = i < 0 ? m_sPath : m_sPath.substring(i+3);
        let sClass = bActive ? "MinIdeTab1" : "MinIdeTab0";
        //let i1 = m_sValue.length; let i0 = m_sValueOrg.length;

        //m_bChanged = m_sValueOrg.normalize() === m_sValue.normalize();
        let sChanged = m_bChanged ? "* " : "";
        return '<span class="'+sClass+'">'+sChanged+'<a class="'+sClass+'" href="javascript:CallIDE('+iId+',2,\''+m_sPath+'\');">'+s+'</a>&nbsp;<a class="'+sClass+'" style="color:#ff0000" href="javascript:CallIDE('+iId+',3,\''+m_sPath+'\');">x</a></span> ';
        return '<input type="button" class="'+sClass+'" value="'+s+'" />';
    }}
    
}

var g_aoMindIDE = [];
function CallIDE(iID,iAction,s)
{
    g_aoMindIDE[iID].CallIDE(iAction,s);
}

function MinIDE(sContainerId)
{
    this.m_iId = g_aoMindIDE.length;
    g_aoMindIDE.push(this);

    this.m_sContainerId = sContainerId;
    this.m_iWidth = 100;
    this.m_iHeight = 100;

    this.m_oEditor = null;

    this.m_sMess = "";

    this.m_hFile = {};
    this.m_oFile = null;

    this.m_bChanges = false;

    this.m_aTabStack = [];

    this._aLoad = ["CodeMirror/lib/codemirror.css","CodeMirror/doc/docs.css","phpFileTree/styles/default/default.css","MinIDE.css"
        ,"CodeMirror/lib/codemirror.js","CodeMirror/addon/edit/matchbrackets.js","phpFileTree/php_file_tree.js"];



    this._Init = function()
    {with(this){
      
        WriteHtml();

        let rTextArea = document.getElementById("MinIDE_Editor"+m_iId);

        m_oEditor = CodeMirror.fromTextArea(rTextArea, {
            lineNumbers: true,
            mode: "text/html",
            matchBrackets: true,
            extraKeys: {
                "Ctrl-S": function(cm) {
                    SaveOpenFile();
                }
                ,"Ctrl-W": function(cm) {   // does not work, strg+w closes the entire window :-(
                    CallIDE(3,m_oFile.m_sPath);
                }
                /*
                , "F11": function(cm) {
                    alert(cm,true); //function called for full screen mode 
                }
                , "Esc": function(cm) {
                    alert(cm,false); //function to escape full screen mode
                }*/
            }

        });

        m_oEditor.on("change",function(cm,change){
            if (m_oFile)
            {
                if (!m_oFile.m_bChanged)
                {
                    m_oFile.m_bChanged = true;
                    _SetTabs();
                }
                if (!m_bChanges)
                {
                    _SetMenu();
                }

            }
        });
        SubmitAjax(1,m_iId);
    }}

    this._Load = function()
    {with(this){
        if (!_aLoad.length)
            return _Init();

        let sLoad = _aLoad.shift();
        loadJS("MinIDE/"+sLoad,this,"_Load");
    }}

    this._Load();


    this.WriteHtml = function()
    {with(this){

        let rContainer = document.getElementById(m_sContainerId);
        m_iWidth = parseInt(rContainer.style.width);
        m_iHeight = parseInt(rContainer.style.height);

        var s = '<style>.CodeMirror { height: auto; max-height:'+Math.round(0.95*m_iHeight)+'vh;width:'+Math.round(0.83*m_iWidth)+'vw; border: 1px solid #ddd; }.CodeMirror-scroll { max-height:'+m_iHeight+'vh; }.CodeMirror pre { padding-left: 7px; line-height: 1.25; }</style>';
        s+= '<div id="ServerMess" class="MinIDEServerMess" style="display:none;" onClick="this.style.display=\'none\'">server mess</div>'
        + '<table class="MinIDE" style="width:100%;height:100%;" border=0><tr><td class="MinIDE_TopLeft" style="height:'+Math.round(0.05*m_iHeight)+'vh" id="MinIDE_TopLeft'+m_iId+'"></td><td id="MinIDE_TopRight'+m_iId+'"></td></tr>'
        + '<tr><td class="MinIDE_BottomLeft" style="height:'+Math.round(0.95*m_iHeight)+'vh" id="MinIDE_BottomLeft'+m_iId+'"></td><td class="MinIDE_BottomRight"style="vertical-align:top;" id="MinIDE_BottomRight'+m_iId+'">'
        + '<div class="MinIDE_Home" style="height:100%;overflow:scroll;display:;" id="MinIDE_Home'+m_iId+'"></div><div class="MinIDE_DivEditor" style="position:relative;height:100%;display:none;" id="MinIDE_DivEditor'+m_iId+'"><textarea class="MinIDE_Editor" style="height:100%" id="MinIDE_Editor'+m_iId+'"></textarea></div></td></tr></table>';
        //alert(s);

        rContainer.innerHTML = s;
    }}

    this.GetValue = function()
    {
        return this.m_oEditor.getValue()   
    }

    this._ShowHomepage = function(bShow,sHtml)
    {with(this){

        let r = document.getElementById("MinIDE_Home"+m_iId);
        if (sHtml)
            r.innerHTML = sHtml;

        let rDivEditor = r.nextSibling;
        if (bShow)
        {
            r.style.display = "";
            rDivEditor.style.display = "none";
        }
        else
        {
            r.style.display = "none";
            rDivEditor.style.display = "";
        }

    }}

    this._SetMenu = function()
    {with(this){

        var s = "";

        bChanges = false;
        Object.values(m_hFile).forEach(oFile => 
        {
            if (oFile.m_bChanged)   bChanges = true;
        });
    
        if (bChanges)
            s += '<input type="button" class="MinIdeMenu" onClick="CallIDE('+m_iId+',5);" value="Save All" />';


        let r = document.getElementById("MinIDE_TopLeft"+m_iId);
        r.innerHTML = s;

    }}



    this._SetTabs = function()
    {with(this){

        var s = "";

        Object.values(m_hFile).forEach(oFile => 
        {
            s += oFile.GetHtmlTab(m_iId,oFile == m_oFile);
        });
        let r = document.getElementById("MinIDE_TopRight"+m_iId);
        r.innerHTML = s;

        //alert(r.parentNode.parentNode.offsetHeight);
        //var oS = document.getElementsByClassName('CodeMirror')[0];
    }}

    this.SaveOpenFile = function()
    {with(this){

        m_oFile.m_sValue = m_oEditor.getValue();
        let sJson = JSON.stringify([m_oFile]);
        SubmitAjax(4,sJson);

    }}

    this._SetEditor = function()
    {with(this){
        m_oEditor.setValue(m_oFile.m_sValue);
    }}

    this._OpenFile = function(oFile,bNew)
    {with(this){
        if (m_oFile)
            m_oFile.m_sValue = m_oEditor.getValue();

        m_oFile = null;
        let r = document.getElementById("MinIDE_BottomRight"+m_iId);
        if (oFile)
        {
            _ShowHomepage(false);
            m_oEditor.setOption("mode", oFile.GetFormat());
            
//            m_oFile = m_hFile[oFile.m_sPath] = oFile;
//            loadJS("MinIDE/mode/javascript/javascript.js",this._SetEditor);

            m_oEditor.setValue(oFile.m_sValue);
            m_oFile = m_hFile[oFile.m_sPath] = oFile;
            //if (bNew)   m_oFile.m_sValue = m_oFile.m_sValueOrg = m_oEditor.getValue();

            //3r.style.visibility = "";

            m_aTabStack.push(m_oFile.m_sPath);
        }
        else
        {
            _ShowHomepage(true);
            //r.style.visibility = "hidden";
        }
        _SetTabs();
    }}

    this.CallIDE = function(iAction,s)
    {with(this){

        switch(iAction)
        {
        case 2:
            if (m_hFile[s])
            {
                if (m_oFile == m_hFile[s])
                    return;

                _OpenFile(m_hFile[s]);
                return;
            }
            SubmitAjax(2,s);
            return;
        case 3:
            if (m_hFile[s])
            {
                let oFile = m_hFile[s];
                if (oFile.m_bChanged)
                    if (!confirm("skip changes ?"))
                        return;

                let bOpen = m_oFile == oFile;
                delete m_hFile[s];
                if (bOpen)
                {
                    let sPrev = false;
                    while (m_aTabStack.length > 0)
                    {
                        sPrev = m_aTabStack.pop();
                        if (m_hFile[sPrev])
                            break;
                    }
                    _OpenFile(m_hFile[sPrev]);
                }
                else 
                    _SetTabs();
                _SetMenu();

            }
            return;
        case 5: // save all
            m_oFile.m_sValue = m_oEditor.getValue();

            let aSave = [];
            Object.values(m_hFile).forEach(oFile => 
                {
                    if (oFile.m_bChanged)
                        aSave.push(oFile);
                });
        

            let sJson = JSON.stringify(aSave);
            SubmitAjax(4,sJson);
    
            return;
        }
    }}
    

    this.ServerMess = function(sMess,bInstant)
    {with(this){
        if (bInstant)
        {
            var rDiv = document.getElementById("ServerMess");
            rDiv.innerHTML = sMess;
            rDiv.style.display = "";
            return;
        }
        if (m_sMess)
            m_sMess += "<br/>";
            m_sMess += sMess;
    }}
    

    this.SubmitAjax = function(iAction,sJson,sUrl)
    {with(this){
        //if (iAction ==3)   return g_iVoice++;
    
        


        //if (m_bSubmited)	return 0;
    
        var oData = new FormData(); // m_rForm
        //oData.append(rSID.name,rSID.value);
        oData.append('action',iAction);
        oData.append('json',sJson);
    
    
        // Create our XMLHttpRequest object
        var hr = new XMLHttpRequest();
        // Create some variables we need to send to our PHP file
        if (!sUrl) 
            sUrl = "MinIDE/MinIDE.php";

        hr.open("POST", sUrl, true);
        // Set content type header information for sending url encoded variables in the request
        //hr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        // Access the onreadystatechange event for the XMLHttpRequest object
        hr.onreadystatechange = function() 
        {
            switch (hr.readyState)
            {
            case 1:
                //ServerMess("server connection established",true);
                break;
            case 2: 
                //ServerMess("request received",true);
                break;
            case 3: 
                //ServerMess("processing request",true);
                break;
            case 4: 
                if(hr.status != 200) 
                {
                    ServerMess("Server Error "+ hr.status + ": " + sUrl);
                    break;
                }

                var sJS = hr.responseText;
                switch(iAction)
                {
                case 1:
                    let oRet = JSON.parse(sJS);
                    let hType = {
                        "php"   :["htmlmixed","xml","javascript","css","clike","php"]
                        , "js"  :["javascript"]
                        , "css" :["css"]
                        , "htm" :["xml","javascript.js","css","vbscript.js","htmlmixed"]
                        , "html" :["xml","javascript.js","css","vbscript.js","htmlmixed"]
                    };
                    let hLoad = {};

                    var re = /([^.]+)'\);/g;
                    var m;
                    do {
                        m = re.exec(oRet.sTree);
                        if (m)  
                            for (var i in hType[m[1]])  
                                hLoad[hType[m[1]][i]] = 1;
                    } while (m);

                    for (var sLoad in hLoad)    loadJS("MinIDE/CodeMirror/mode/"+sLoad+"/"+sLoad+".js");

/*                        
                        <script src="MinIDE/mode/xml/xml.js"></script>
                        <script src="MinIDE/mode/javascript/javascript.js"></script>
                        <script src="MinIDE/mode/css/css.js"></script>
                        <script src="MinIDE/mode/clike/clike.js"></script>
                        <script src="MinIDE/mode/php/php.js"></script>
                        <script src="MinIDE/mode/htmlmixed/htmlmixed.js"></script>
  */                                            
                        

                    let r = document.getElementById("MinIDE_BottomLeft"+m_iId);

                    sTree = '<div style="height:100%;width:'+Math.round(0.15*m_iWidth)+'vw;vertical-align:top;overflow:scroll;">' + oRet.sTree + '</div>';
                    r.innerHTML = sTree;
                    init_php_file_tree();

                    SubmitAjax(6,"",oRet.sHomeUrl);
                    break;
                case 2:
                    _OpenFile(new File(sJson,sJS),true);
                    break;
                case 4:
                    let oSaved = JSON.parse(sJS);
                    for(var i in oSaved.aSaved)
                    {
                        let oFile = m_hFile[oSaved.aSaved[i]];
                        if (oFile) oFile.m_bChanged = false;
                    }
                    let aNot = [];
                    Object.keys(oSaved.hNot).forEach(sNot => 
                        {
                            aNot.push(sNot);
                        });
                    if (aNot.length)
                        ServerMess("can not save files of type" + (aNot.length>1 ? "s":"") +" : " + aNot.join(" , "));
                
                    _SetTabs();
                    _SetMenu();
                    break;
                case 6: // home page
                {
                    _ShowHomepage(true,sJS);
                    break;
                }
                default:
                    //ServerMess("update: "+ sJS.length);
                    //eval(sJS);
                    try {
                        eval(sJS); 
                    } catch (e) {
                        if (e instanceof SyntaxError) {
                            ServerMess(e.message + "\nresponseText:\n'"+sJS+"'");
                        } else {
                            throw( e );
                        }
                    }
                }
    
            }
            if (m_sMess)
            {
                var rDiv = document.getElementById("ServerMess");
                rDiv.innerHTML = m_sMess;
                rDiv.style.display = "";
                m_sMess = "";
            
                window.setTimeout(function () 
                {
                    rDiv.style.display = "none";
                }, 3000);
            }

        }
        // Send the data to PHP now... and wait for response to update the status div
        hr.send(oData); // Actually execute the request
    }}
    

}