
var g_IdMinIDE = 1;
function MinIDE(rContainer)
{
    this.m_oId = g_IdMinIDE++;
    this.m_rContainer = null;

    this.m_oEditor = null;

    this.m_sMess = "";


    this.GetHtml = function()
    {with(this){
        var s = '<div id="server" style="display:none;position:absolute;left:10%;top:5%;width:80%;" onClick="this.style.display=\'none\'">server mess</div>';
        s += '<table class="MinIDE" border=0><tr><td class="MinIDE_TopLeft" id="MinIDE_TopLeft'+m_oId+'"></td><td id="MinIDE_TopRight'+m_oId+'"></td></tr>';
        s += '<tr><td class="MinIDE_BottomLeft" id="MinIDE_BottomLeft'+m_oId+'"></td><td class="MinIDE_BottomRight" id="MinIDE_BottomRight'+m_oId+'"><textarea class="MinIDE_Editor" id="MinIDE_Editor'+m_oId+'"><script>\nvar sTest  = prompt("enter a string");\n</script></textarea></td></tr></table>';
        //alert(s);
        return s;
    }}

    this.GetValue = function()
    {
        return this.m_oEditor.getValue()   
    }

    this.CallIDE = function(s)
    {with(this){
        SubmitAjax(2,s);
    }}
    

    this.ServerMess = function(sMess,bInstant)
    {with(this){
        if (bInstant)
        {
            var rDiv = document.getElementById("server");
            rDiv.innerHTML = sMess;
            rDiv.style.display = "";
            return;
        }
        if (m_sMess)
            m_sMess += "<br/>";
            m_sMess += sMess;
    }}
    

    this.SubmitAjax = function(iAction,sJson,sConfirm)
    {with(this){
        //if (iAction ==3)   return g_iVoice++;
    
        if (sConfirm)
            if (!confirm(sConfirm)) return 0;
    
        //if (m_bSubmited)	return 0;
    
        var oData = new FormData(); // m_rForm
        //oData.append(rSID.name,rSID.value);
        oData.append('action',iAction);
        oData.append('json',sJson);
    
    
        // Create our XMLHttpRequest object
        var hr = new XMLHttpRequest();
        // Create some variables we need to send to our PHP file
        var sUrl = "MinIDE/ajax.php";
        hr.open("POST", sUrl, true);
        // Set content type header information for sending url encoded variables in the request
        //hr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        // Access the onreadystatechange event for the XMLHttpRequest object
        hr.onreadystatechange = function() 
        {
            switch (hr.readyState)
            {
            case 1:
                ServerMess("server connection established",true);
                break;
            case 2: 
                ServerMess("request received",true);
                break;
            case 3: 
                ServerMess("processing request",true);
                break;
            case 4: 
                if(hr.status != 200) 
                {
                    ServerMess("request finished ´but failed response.");
                    break;
                }

                var sJS = hr.responseText;
                switch(iAction)
                {
                case 1:
                    let r = document.getElementById("MinIDE_BottomLeft"+m_oId);
                    r.innerHTML = sJS;
                    init_php_file_tree();
                    break;
                case 2:
                    //alert(sJS);
                    var re = /\.([^.]+)$/;
                    var aM = sJson.match(re);
                    if (aM)
                    {
                        let sExt = aM[1].toLowerCase();

                        var h = {"js":"text/javascript", "c":"text/x-csrc", "h":"text/x-csrc", "css":"text/css", "htm":"text/html", "html":"text/html", "php":"text/x-php"};
                        if (h[sExt])
                        {
                            //alert(sExt + " = '" + h[sExt] + "'");
                            m_oEditor.setOption("mode", h[sExt]);
                        }
                        else
                            m_oEditor.setOption("mode", "text/plain");
                    }

                    m_oEditor.setValue(sJS);
                    break;
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
    
                var rDiv = document.getElementById("server");
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
    
    with (this)
    {
        if (rContainer)
        {
            m_rContainer = document.getElementById(rContainer);
            m_rContainer.innerHTML = GetHtml();

            let rTextArea = document.getElementById("MinIDE_Editor"+m_oId);

            m_oEditor = CodeMirror.fromTextArea(rTextArea, {
                lineNumbers: true,
                mode: "text/html",
                matchBrackets: true
            });

            SubmitAjax(1);
        
        }

    }

}


