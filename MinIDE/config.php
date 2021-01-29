<html>
    <head>
    <meta name="viewport" content="initial-scale=1, maximum-scale=1">        
    <style>
td.L
{
    text-align: right;
    font-size: 14pt;
}
input
{
    font-size: 16pt;
    text-align:center;
}
th
{
    padding-top:10pt;
}
div.Mess
{
    border: outset 2px #ffaa00;
    background-color: #ffffee;
    color: #aa6600;
    font-size: 18pt;
}
</style>

</head>
<body>
    <center>
<?php

define('C_bCacheLog',	0);
define('C_bNoLog',	0);
define('C_sLogFile',	'config.log');

require('_common.php');

define('DEMO_VERSION',strpos($_SERVER['HTTP_HOST'],'robosoft') !== FALSE);

$sMess = "";

usleep(500000);     // always wait 0,5s to prevent brute force attacks

$hConfigLoad = (array)LoadConfig($_REQUEST['config']);

x("check demo version");

if (! DEMO_VERSION && !$hConfigLoad['pPassword'])
{
    $hConfigLoad['pPassword'] = randomPassword();
    $sConfigPath = SaveConfig($hConfigLoad,$_REQUEST['config']);
    Mess("random password set, read it in $sConfigPath via ftp !");
}

x("done");

if (isset($_POST['save']))
{
    $bSave = true;
    $hConfig = array();

    if ($_POST['pPassword'] != $hConfigLoad['pPassword'])
        $bSave = Mess("wrong pPassword");
    else
    {
        $hConfig = $hConfigLoad;
        if ($_POST['pPasswordNew1'] || $_POST['pPasswordNew2'])
        {
            if ($_POST['pPasswordNew1'] != $_POST['pPasswordNew2']) 
                $bSave = Mess("new pPasswordNew1 != pPasswordNew2");
            else
            {
                $_POST['pPassword'] = $_POST['pPasswordNew1'];
                $_POST['pPasswordNew1'] = $_POST['pPasswordNew2'] = "";
            }
        }
    }

    foreach($_POST AS $sKey => $sValue)
    {
        if (isset($hConfigLoad[$sKey]))
        {
            if ($sKey{0} == 'i')    $sValue = intval($sValue);
            else if ($sKey{0} == 'b')    $sValue = intval($sValue);
            else if ($sKey{0} == 'f')    $sValue = floatval($sValue);
            $hConfig[$sKey] = $sValue;
        }
    }

    if ($bSave)
    {
        if ($_POST['newKey'])
            if (isset($_POST['delKey']))
                unset($hConfig[$_POST['newKey']]);
            else
                $hConfig[$_POST['newKey']] = $_POST['newValue'];

        ksort($hConfig);

        if (DEMO_VERSION)
            Mess("demo version :-) config save not allowed.");
        else if (SaveConfig($hConfig,$_REQUEST['config']))
            Mess("config saved :-)");
    }

    
}
else
    $hConfig['pPassword'] = "";

$s = "<form method=post onsubmit='return OnSubmit(this,event);'><table border=0><tr>";
$i = 0;
$iCols = 2;
foreach ($hConfig as $sKey => $sValue) 
{
    $sStyle = "";
    switch ($sKey{0})
    {
    case "i":
        $sStyle .= "style='width:60pt;' type='number'";
        break;
    case "p":
        $sStyle .= "style='width:60pt;' type='password'";
        break;
    case "f":
        $sStyle .= "style='width:60pt;' type='number' step='0.001'";
        $sValue = round($sValue,3);
        break;
    case "b":
        $sStyle .= "size='1'";
        break;
    }

    $i++;
    $s .= "<td class=L>$sKey:</td><td><input $sStyle name='$sKey' value='$sValue'/></td>" ;
    if ($i % $iCols == 0)  $s .= "</tr><tr>" ;
}
if ($bSave)
    $s .= "<tr><td class=L><input style='width:80pt;' name='newKey' onKeyUp='SetType(this.value)' value=''/></td><td colspan='".(2*$iCols-1)."'><input type=number id='newValue' style='width:120pt;' name='newValue' value=''/><label for='delKey'><input type='checkbox' name='delKey' value='1' id='delKey'/>delete</label></td></tr>" ;

$s .= "</tr></table>
<input type=submit name='save' value='save'/> 

</form>";

if ($sMess)
    print "<div class='Mess'>$sMess</div>\n";
print $s;

xx();

function randomPassword() {
    $alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    $pass = array(); //remember to declare $pass as an array
    $alphaLength = strlen($alphabet) - 1; //put the length -1 in cache
    for ($i = 0; $i < 8; $i++) {
        $n = rand(0, $alphaLength);
        $pass[] = $alphabet[$n];
    }
    return implode($pass); //turn the array into a string
}

function generatePassword($length = 8) {
    
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $count = mb_strlen($chars);

    for ($i = 0, $result = ''; $i < $length; $i++) {
        $index = rand(0, $count - 1);
        $result .= mb_substr($chars, $index, 1);
    }

    return $result;
}

function Mess($s)
{
    global $sMess;
    $sMess .= "$s<br/>";
    return false;
}
?>
<script>

rSubmit = 0;
function Confirm(rInput)
{
    rSubmit = rInput;
}

function OnSubmit(rForm,event)
{
    if (rSubmit)
        if (!confirm(rSubmit.value + " ?"))   return false;

    if (!rForm.pPassword.value)
    {
//        if (!rForm.pPasswordNew1.value)
//            return Alert("you have to set your pPasswordNew1 = pPasswordNew2");
        if (rForm.pPasswordNew1.value != rForm.pPasswordNew2.value)
            return Alert("pPasswordNew1 != pPasswordNew2");

    }
    return true;
}

function Alert(s)
{
    alert(s);
    return false;
}

function SetType(sKey)
{
    if (sKey.length < 2)    return;
    var r = document.getElementById("newValue");

    r.type = r.min = r.max = "";
    r.step = 1;
    switch (sKey.substr(0,1))
    {
        case "i":
            r.type = "number";
            r.style.width = "50pt";
            break;
        case "p":
            r.type = "password";
            r.style.width = "50pt";
            break;
        case "f":
            r.type = "number";
            r.step = 0.001;
            r.style.width = "100pt";
            break;
        case "b":
            r.type = "number";
            r.min = 0;
            r.max = 1;
            r.style.width = "40pt";
            break;
        default:
        r.style.width = "160pt";

    }
}

</script>
</center>
</body>
</html>