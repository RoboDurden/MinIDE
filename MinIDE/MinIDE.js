
function GetCallback(rCallback,rCallbackObject,sServerscript)
{
    return {"rCallback": rCallback, "rCallbackObject": rCallbackObject, "sServerscript": sServerscript};
}


function File(sPath,sValue,bOrg,bEditable)
{
    this.m_sPath = sPath;
    this.m_sValue = sValue;
    this.m_bOrg = bOrg; // no modified file yet saved to config.sRootSave
    this.m_bEditable = bEditable;
    this.m_oCursor = null;
    this.m_oScrollInfo = null;

    this.m_rContainer = null;

    //this.m_sValueOrg = "";
    this.m_bChanged = false;


    this.UpdateData = function(rEditor)
    {with(this){
        if (!m_bEditable)
            return;

        //let aLineChar = this.m_oEditor.getCursor();
        m_sValue = rEditor.getValue();
        m_oCursor = rEditor.getCursor();
        m_oScrollInfo = rEditor.getScrollInfo();                        
    }}

    this.SetState = function(bChanged,bOrg)
    {with(this){
        m_bChanged = bChanged;
        m_bOrg = bOrg;
    }}

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

    this.GetHtmlTab = function(rIde,bActive)
    {with(this){
        let i = m_sPath.indexOf("../");
        let s = i < 0 ? m_sPath : m_sPath.substring(i+3);
        let sClass = bActive ? "MinIdeTab1" : "MinIdeTab0";
        //let i1 = m_sValue.length; let i0 = m_sValueOrg.length;

        //m_bChanged = m_sValueOrg.normalize() === m_sValue.normalize();
        let sChanged = m_bChanged ? "* " : "";
        let iId = rIde.m_iId;
        let sLabel = m_sPath;
        if (rIde.m_sRootOrg)
        {
            let iPos = m_sPath.indexOf(rIde.m_sRootOrg);
            if (iPos >= 0 )
            {
                sLabel = m_sPath.substring(iPos+rIde.m_sRootOrg.length+1);
            }
        }
        let sHtml = '<span class="'+sClass+'">'+sChanged+'<a class="'+sClass+'" href="javascript:CallIDE('+iId+',2,\''+m_sPath+'\');">'+sLabel+'</a>';
        if (this.m_bEditable)
            sHtml += '&nbsp;<a class="'+sClass+'" style="color:#ff0000" href="javascript:CallIDE('+iId+',3,\''+m_sPath+'\');">x</a>';
        return sHtml + "</span> ";
        return '<input type="button" class="'+sClass+'" value="'+s+'" />';
    }}
    
}

var g_aoMindIDE = [];
function CallIDE(iID,iAction,s)
{
    g_aoMindIDE[iID].CallIDE(iAction,s);
}

function MinIDE(sContainerId,sPathConfig,oAjaxExtern)
{
    this.m_iId = g_aoMindIDE.length;
    g_aoMindIDE.push(this);

    this.m_sContainerId = sContainerId;
    this.m_sPathConfig = sPathConfig;

    // used by AjaxSend() for external usage of ajax engine
    if (oAjaxExtern)    
        oAjaxExtern.bExtern = true;
    this.m_oAjaxExtern = oAjaxExtern;

    this.m_iWidth = 100;
    this.m_iHeight = 100;

    this.m_oEditor = null;

    this.m_sMess = "";
    this.m_hInterval = null;

    this.m_hFile = {};
    this.m_oFile = null;
    this.m_slastEdit = "";

    this.m_hButton = {};

    this.m_bChanges = false;

    this.m_aTabStack = [];

    this._aLoad = ["CodeMirror/lib/codemirror.css","CodeMirror/doc/docs.css","CodeMirror/addon/dialog/dialog.css","CodeMirror/addon/search/matchesonscrollbar.css"
        ,"phpFileTree/styles/default/default.css","MinIDE.css"
        ,"CodeMirror/lib/codemirror.js","CodeMirror/addon/edit/matchbrackets.js","CodeMirror/addon/dialog/dialog.js","CodeMirror/addon/search/searchcursor.js"
        ,"CodeMirror/addon/search/search.js","CodeMirror/addon/scroll/annotatescrollbar.js","CodeMirror/addon/search/matchesonscrollbar.js"
        ,"CodeMirror/addon/search/jump-to-line.js","phpFileTree/php_file_tree.js"];

    this.m_sRootOrg = "";

    this.m_sHello = "";
    this.m_sHelp = `
<table style="font-size:12pt;">
    <tr><td>Ctrl-S</td><td style="text-align:left;">save file</td></tr>
    <tr><td>Ctrl-F / Cmd-F</td><td style="text-align:left;">Start searching</td></tr>
    <tr><td>Ctrl-G / Cmd-G</td><td style="text-align:left;">Find next</td></tr>
    <tr><td>Shift-Ctrl-G / Shift-Cmd-G</td><td style="text-align:left;">Find previous</td></tr>
    <tr><td>Shift-Ctrl-F / Cmd-Option-F</td><td style="text-align:left;">Replace</td></tr>
    <tr><td>Shift-Ctrl-R / Shift-Cmd-Option-F</td><td style="text-align:left;">Replace all</td></tr>
    <tr><td>Alt-F</td><td style="text-align:left;">Persistent search (dialog doesn't autoclose,
    enter to find next, Shift-Enter to find previous)</td></tr>
    <tr><td>Alt-G</td><td style="text-align:left;">Jump to line</td></tr>
</table>
`;
    
    this._Init = function()
    {with(this){
      
        WriteHtml();

        let rTextArea = document.getElementById("MinIDE_Editor"+m_iId);

        m_oEditor = CodeMirror.fromTextArea(rTextArea, {
            lineNumbers: true,
            mode: "text/html",
            matchBrackets: true,
            customKeys: {
            },

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
        SubmitAjax(1,JSON.stringify({"iId":m_iId, "sPathConfig":m_sPathConfig}));
    }}


    this.LoadTree = function(sPathConfig,oCallbackReturn)
    {with(this){
        if (sPathConfig.bSuccess)    // the final callback :-)
        {
            sPathConfig.oParam = sPathConfig.sPathConfig;
            _DoCallback(sPathConfig);
            return;
        }

        let sPathConfigNew = sPathConfig.sPathConfig ? sPathConfig.sPathConfig : sPathConfig;

        let oCallback = {"rCallback":LoadTree, "rCallbackObject":this,"oParam": oCallbackReturn ? oCallbackReturn : {}  };
        if (oCallbackReturn)
            oCallback.oParam = oCallbackReturn;
        else if (sPathConfig.rCallback)
            oCallback.oParam = sPathConfig;
        else
            oCallback.oParam = {};

        oCallback.oParam.sPathConfig = sPathConfigNew;

        if (!CloseAllEditable(oCallback)   )
            return; // user cancled to save some changes or server save will call back

        // now load new tree :-)
        m_sPathConfig = sPathConfigNew;
        oCallback.oParam.bSuccess = true;
        SubmitAjax(1,JSON.stringify({"iId":m_iId}), oCallback);
    }}

    this.CloseTree = function()   // will not save changes! call SaveAll yourself in advance
    {with(this){

        m_oFile = null;
        for (var sPath in m_hFile)
        if (m_hFile[sPath].m_bEditable)
            delete m_hFile[sPath];

        _OpenFile(null);
        _SetMenu();

        m_sRootOrg = "";
        let r = document.getElementById("MinIDE_BottomLeft"+m_iId);
        r.innerHTML = "";
    }}


    this._Load = function()
    {with(this){
        if (!_aLoad.length)
            return _Init();

        let sLoad = _aLoad.shift();
        LoadResource(sLoad, {"rCallback":_Load, "rCallbackObject":this, "sLoaded":sLoad} );
    }}

    this._Load();


    this.WriteHtml = function()
    {with(this){

        let rContainer = document.getElementById(m_sContainerId);
        m_iWidth = parseInt(rContainer.style.width);
        m_iHeight = parseInt(rContainer.style.height);

        var s = '<style>.CodeMirror { height: auto; max-height:'+Math.round(0.95*m_iHeight)+'vh;width:'+Math.round(0.83*m_iWidth)+'vw; border: 1px solid #ddd; }.CodeMirror-scroll { max-height:'+m_iHeight+'vh; }.CodeMirror pre { padding-left: 7px; line-height: 1.25; }</style>';
        s+= '<div id="ServerMess" class="MinIDEServerMess" style="display:none;" onClick="this.innerHTML=\'\';this.style.display=\'none\'"></div>'
        + '<table class="MinIDE" style="width:100%;height:100%;" border=0><tr><td class="MinIDE_TopLeft" style="text-align:center;height:'+Math.round(0.05*m_iHeight)+'vh" id="MinIDE_TopLeft'+m_iId+'"></td><td id="MinIDE_TopRight'+m_iId+'"></td></tr>'
        + '<tr><td class="MinIDE_BottomLeft" style="height:'+Math.round(0.95*m_iHeight)+'vh" id="MinIDE_BottomLeft'+m_iId+'"></td><td class="MinIDE_BottomRight"style="vertical-align:top;" id="MinIDE_BottomRight'+m_iId+'">'
        + '<div class="MinIDE_DivEditor" style="position:relative;height:100%;display:none;" id="MinIDE_DivEditor'+m_iId+'"><textarea class="MinIDE_Editor" style="height:100%" id="MinIDE_Editor'+m_iId+'"></textarea></div></td></tr></table>';
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

        let r = document.getElementById("MinIDE_TopLeft"+m_iId);
        if (!r)
            return; // not yet written to dom

        var s = "";

        bChanges = false;
        Object.values(m_hFile).forEach(oFile => 
        {
            if (oFile.m_bChanged)   bChanges = true;
        });
    
        this.SetButton("Save All",bChanges ? 'CallIDE('+m_iId+',5);' : false,true);

        for (var sButton in m_hButton)
            s += " " + '<input class="MinIdeMenu" onClick="'+m_hButton[sButton]+'" type="button" value="'+sButton+'"\/>'
            
            ;

        r.innerHTML = s;

    }}

    this.SetButton = function(sName,sOnClick,bNoSetMenu)
    {with(this){
        if (sOnClick)
            m_hButton[sName] = sOnClick;
        else 
            delete m_hButton[sName];

        if (!bNoSetMenu)
            _SetMenu();
    }}


    this._SetTabs = function()
    {with(this){

        var s = "";

        let i=0;
        Object.values(m_hFile).forEach(oFile => 
        {
            s += oFile.GetHtmlTab(this,oFile == m_oFile);
            i++;
        });
        let r = document.getElementById("MinIDE_TopRight"+m_iId);
        r.innerHTML =  i>1 ? s : "";

        //alert(r.parentNode.parentNode.offsetHeight);
        //var oS = document.getElementsByClassName('CodeMirror')[0];
    }}

    this.CloseFile = function(oCallback)
    {with(this){
        let sPath = oCallback.sPath ? oCallback.sPath : oCallback;

        if (!m_hFile[sPath])
            return true;
        let oFile = m_hFile[sPath];
        if (oFile.m_bChanged)
        {
            if (oCallback.sPath)
            {
                if (confirm("save changes to server ?"))
                {
                    SaveFile(sPath,oCallback);
                    return false;
                }                
            }
            else if (!confirm("skip changes ?"))
                return false;
        }

        let bOpen = m_oFile == oFile;
        if (oFile.m_bEditable)
            delete m_hFile[sPath];
        
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
        if (!oFile.m_bOrg && !oCallback.sPath)  
            if (confirm("also delete your server saved changes ?"))
            {
                SubmitAjax(7,sPath,oCallback);
                return false;
            }
        return true;
    }}


    this.SaveFile = function(sPath,oCallback)
    {with(this){
        if (sPath == this.m_oFile.m_sPath)
            m_oFile.UpdateData(m_oEditor);
        SubmitAjax(4,JSON.stringify([m_hFile[sPath]]),oCallback);
    }}


    this.SaveOpenFile = function()
    {with(this){
        m_oFile.UpdateData(m_oEditor);
        let sJson = JSON.stringify([m_oFile]);
        SubmitAjax(4,sJson);

    }}

    this.Find = function(s)
    {with(this){
        if (!s)
            s = prompt("search for:");
        alert("find " + s);
    }}
    this.Goto = function(iLine)
    {with(this){
        if (iLine<0)
            iLine = prompt("go to line:");
        iLine = parseInt(iLine);
        if (isNaN(iLine))
            return;
        //alert("now goto line " + iLine);

        m_oEditor.setCursor(iLine,0);
        var t = m_oEditor.charCoords({line: iLine, ch: 0}, "local").top; 
        var middleHeight = m_oEditor.getScrollerElement().offsetHeight / 2; 
        m_oEditor.scrollTo(null, t - middleHeight - 5); 

        //m_oEditor.setCursor(iLine,0,{scroll:true});
        //m_oEditor.scrollTo(oFile.m_oScrollInfo.left,oFile.m_oScrollInfo.top);

    }}


    this._SetEditor = function()
    {with(this){
        m_oEditor.setValue(m_oFile.m_sValue);
    }}

    this._OpenFile = function(oFile,bNew)
    {with(this){
        if (m_oFile) 
        {
            m_oFile.UpdateData(m_oEditor);

            if (m_oFile.m_rContainer)
                m_oFile.m_rContainer.style.display = "none";
            m_oFile = null;
        }

        //let r = document.getElementById("MinIDE_BottomRight"+m_iId);
        // '<div class="MinIDE_Home" style="height:100%;overflow:scroll;display:;" id="MinIDE_Home'+m_iId+'"></div>
        //let rHome = document.getElementById("MinIDE_Home"+m_iId);
        let rDivEditor = document.getElementById("MinIDE_DivEditor"+m_iId);
        
        if (oFile)
        {
            //_ShowHomepage(false);
            if (oFile.m_bEditable)
            {
                rDivEditor.style.display = "";
                if (m_slastEdit != oFile.m_sPath)
                {
                    m_oEditor.setOption("mode", oFile.GetFormat());
                    m_oEditor.setValue(oFile.m_sValue);
                    if (oFile.m_oCursor)
                    {
                        m_oEditor.setCursor(oFile.m_oCursor);
                        m_oEditor.scrollTo(oFile.m_oScrollInfo.left,oFile.m_oScrollInfo.top);
                    }
                    
                    m_slastEdit = oFile.m_sPath;
                }

                m_oEditor.focus();

                //if (bNew)   m_oFile.m_sValue = m_oFile.m_sValueOrg = m_oEditor.getValue();

            }
            else
            {
                rDivEditor.style.display = "none";
                if (!oFile.m_rContainer)  // first time displayed
                {
                    let r = document.createElement("div");
                    r.style.height = "100%";
                    r.style.overflow = "scroll"
                    r.style.display = "none";
                    r.innerHTML = oFile.m_sValue;

                    rDivEditor.parentNode.insertBefore(r,rDivEditor);
                    oFile.m_rContainer = r;
                }
                oFile.m_rContainer.style.display = "";
                //rDivEditor.style.display = "none";
            }
            m_oFile = m_hFile[oFile.m_sPath] = oFile;
            m_aTabStack.push(m_oFile.m_sPath);
        }
        else
        {
            for (var sPath in m_hFile)
                if (!m_hFile[sPath].m_bEditable)
                {
                    _OpenFile(m_hFile[sPath]);
                    break;
                }


            //_ShowHomepage(true);
            //r.style.visibility = "hidden";
        }
        _SetTabs();
    }}

    this.CloseAllEditable = function(oCallback)
    {with(this){
        //let bNoOpen = true;
        for (var sPath in m_hFile)
            if (m_hFile[sPath].m_bEditable)
            {
                //bNoOpen = false;
                oCallback.sPath = sPath;
                if (!CloseFile(oCallback))
                    return false;
            }
        //return bNoOpen;
        return true;
    }}

    this.CallIDE = function(iAction,s)
    {with(this){

        switch(iAction)
        {
        case 2: // open file s
            if (m_hFile[s])
            {
                if (m_oFile == m_hFile[s])
                    return;

                _OpenFile(m_hFile[s]);
                return;
            }
            SubmitAjax(2,s);
            return;
        case 3: // close file s
            CloseFile(s);
            return;
        case 5: // save all
            SaveAll();
            return;
        case 8: // help button
            Mess(m_sHelp,m_sHelp.length > 100 ? 30 : 5);
            return;
        }
    }}
    
    this.SaveAll = function(oCallback)
    {with(this){
        m_oFile.UpdateData(this.m_oEditor);

        let aSave = [];
        Object.values(m_hFile).forEach(oFile => 
            {
                if (oFile.m_bChanged)
                    aSave.push(oFile);
            });
        if (!aSave.length)
            return true;

        SubmitAjax(4,JSON.stringify(aSave),oCallback);
        return false;
    }}

    this.Mess = function(s,iSeconds)
    {with(this){
        var rDiv = document.getElementById("ServerMess");
        if (rDiv.innerHTML)
            s = rDiv.innerHTML + "<hr/>" + s;
        rDiv.innerHTML = s + " <span id='TimerMess'></span>";
        rDiv.style.display = "";

        if (m_hInterval)
            window.clearInterval(m_hInterval);
        
        m_hInterval = window.setInterval(function () 
        {
            var r = document.getElementById("TimerMess");
            if (r)
                r.innerHTML = iSeconds--;
            if (iSeconds<0)
            {
                rDiv.innerHTML = "";
                rDiv.style.display = "none";
                window.clearInterval(m_hInterval);
                m_hInterval = null;
            }
        }, 1000);
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

    this._InitTree = function(oCallback)
    {with(this){
        let oRet = oCallback._oRet;
        if (oRet && oRet.sTree)  // first call
        {
            let hType = {
                "php"   :["htmlmixed","xml","javascript","css","clike","php"]
                , "js"  :["javascript"]
                , "css" :["css"]
                , "htm" :["xml","javascript","css","vbscript","htmlmixed"]
                , "html" :["xml","javascript","css","vbscript","htmlmixed"]
                , "cpp"  :["clike"]
                , "c"  :["clike"]
                , "h"  :["clike"]
            };
            oRet.aLoad = [];

            var re = /([^.]+)'\);/g;
            var m;
            do {
                m = re.exec(oRet.sTree);
                if (m)  
                    for (var i in hType[m[1]])  
                        if (!oRet.aLoad.includes(hType[m[1]][i]))
                        oRet.aLoad.push(hType[m[1]][i]);
                        //hLoad[hType[m[1]][i]] = 1;
            } while (m);
            oRet.sTree = false;
        }

        if (oRet.aLoad.length)
        {
            let sLoad = oRet.aLoad.pop();
            LoadResource("CodeMirror/mode/"+sLoad+"/"+sLoad+".js", {"rCallback":_InitTree, "rCallbackObject":this, "oParam":oCallback} );
        }
        else
        {
            if (oRet.aOpen)
            {
                for(var i=oRet.aOpen.length; i>=0; i--)
                    SubmitAjax(2,oRet.aOpen[i]);
            }
            _DoCallback(oCallback);
        }
    }}

    this.AjaxSend = function(iAction,oJson)
    {with(this){
        let sJsonSend = JSON.stringify(oJson);
        SubmitAjax(iAction,sJsonSend,m_oAjaxExtern);
    }}


    this.SubmitAjax = function(iAction,sJson,oCallback)
    {with(this){
        var oData = new FormData(); // m_rForm
        //oData.append(rSID.name,rSID.value);
        oData.append('action',iAction);
        oData.append('json',sJson);
        if (m_sPathConfig)
            oData.append('config',m_sPathConfig);
    
    
        // Create our XMLHttpRequest object
        var hr = new XMLHttpRequest();
        // Create some variables we need to send to our PHP file

//      let bExternalCall = false;
        let sUrl = GetScriptBase() + "MinIDE.php";
        if (oCallback)
        {
            if (oCallback.sServerscript)
            {
                sUrl = oCallback.sServerscript;
//                bExternalCall = true;
            }
        }

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

                var sRet = hr.responseText;
                let oRet = null;
                if (sRet.match(/^\{.*\}$/))
                //if (!bNoJson)
                {
                    try 
                    {
                        oRet = JSON.parse(sRet);
                    } catch(e) 
                    {
                        ServerMess(e+"\n"+sRet);
                        break;
                    }

                    if (oRet.sError)
                    {
                        ServerMess(oRet.sError);
                        break;
                    }
                }
 
                if (oCallback && oCallback.bExtern)
                {
                    oRet.iAction = iAction;
                    oCallback.oParam = oRet;
                    _DoCallback(oCallback);
3                }
                else 
                {
                    switch(iAction)
                    {
                    case 1:
                        if (oRet.sTree)
                        {
                            m_sRootOrg = oRet.sRootOrg;
                            let r = document.getElementById("MinIDE_BottomLeft"+m_iId);

                            sTree = '<div style="height:100%;width:'+Math.round(0.15*m_iWidth)+'vw;vertical-align:top;overflow:scroll;">' + oRet.sTree + '</div>';
                            r.innerHTML = sTree;
                            init_php_file_tree();

                            if (!oCallback)
                                oCallback = {};

                            oCallback._oRet = oRet;
                            _InitTree(oCallback);
                            oCallback = null;
                            oRet.sMess = oRet.sMess ? oRet.sMess + m_sHello : m_sHello;
                            m_sHello = "";

                            SetButton("?",'CallIDE('+m_iId+',8)');
                        }

                        if (oRet.sHomeUrl)
                            SubmitAjax(6,"",{"sServerscript": oRet.sHomeUrl}    );

                        break;
                    case 2:
                        let oFile = new File(sJson,oRet.sFile,oRet.bOrg,true);
                        if (oRet.hSetting)
                        {
                            oFile.m_oCursor = {"ch":oRet.hSetting.iChar, "line" : oRet.hSetting.iLine};
                            oFile.m_oScrollInfo = {"left":0, "top" : oRet.hSetting.iTop};
                        }
                        _OpenFile(oFile,true);
                        break;
                    case 4:
                        for(var i in oRet.aSaved)
                        {
                            let oFile = m_hFile[oRet.aSaved[i]];
                            if (oFile) oFile.SetState(false,oRet.bOrg);
                        }
                        let aNot = [];
                        Object.keys(oRet.hNot).forEach(sNot => 
                            {
                                aNot.push(sNot);
                            });
                        if (aNot.length)
                        {
                            ServerMess("can not save files of type" + (aNot.length>1 ? "s":"") +" : " + aNot.join(" , "));
                            oCallback = null;   // abort 
                        }
                    
                        _SetTabs();
                        _SetMenu();
                        break;
                    case 6: // home page
                    {
                        let sName = sUrl.split(".")[0];
                        _OpenFile(new File(sName,sRet,true,false),true);
                        //_ShowHomepage(true,sRet);
                        break;
                    }
                    case 7: // user file deleted
                    {
                        let oFile = m_hFile[oRet.sDeleted];
                        if (oFile)
                        {
                            oFile.m_sValue = oRet.sValue;
                            oFile.SetState(false,false);
                        } 
                        break;
                    }
                    default:
                        ServerMess("unkown action: "+ iAction);
                    }
                    _DoCallback(oCallback);
                }
                if (oRet) if (oRet.sMess)
                    ServerMess(oRet.sMess);
            }

            if (m_sMess)
            {
                Mess(m_sMess,m_sMess.length > 100 ? 30 : 5);
                m_sMess = "";
            }

        }
        // Send the data to PHP now... and wait for response to update the status div
        hr.send(oData); // Actually execute the request
    }}
    

}


function GetScriptBase()
{
    var aScript = document.getElementsByTagName('script');
    let iPos;
    for (var i in aScript)
        if (aScript[i].src)
            if (0 < (iPos = aScript[i].src.indexOf("MinIDE.js")))
                return aScript[i].src.substring(0,iPos);

    return false;
}

function _DoCallback(oCallback)
{
    if (oCallback)
        if (oCallback.rCallback)
            if (oCallback.rCallbackObject)
                oCallback.rCallback.call(oCallback.rCallbackObject,oCallback.oParam);
            else
                oCallback.rCallback(oCallback.oParam);
}


LoadResource = function(url, oCallback){
    var aM = url.match(/\.([^.]+)$/);
    let sExt = aM[1].toLowerCase();

    var scriptTag;
    url = GetScriptBase() + url;
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

    scriptTag.oCallback = oCallback;

    scriptTag.onerror = function(){alert(url + " not found -> aboarting MinIDE :-(")};
    if (oCallback)
    {
        scriptTag.onload = function()
        {
            _DoCallback(oCallback);
        }
    }

    document.body.appendChild(scriptTag);
};
