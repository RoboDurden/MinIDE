<?php


header("Access-Control-Allow-Origin: *");
//header("Access-Control-Allow-Methods: GET, POST, PUT");
//header("Access-Control-Allow-Headers: Content-Type");

//define('C_bCacheLog',	0);
define('C_bNoLog',	0);
define('C_sLogFile',	'MinIDE.log');

require('_common.php');

if (!isset($_REQUEST['action']))
    die ("ServerMess('no action');");

$oConfig = isset($_REQUEST['config']) ? LoadConfig($_REQUEST['config']) : LoadConfig();

x("oConfig\n:".print_r($oConfig,true));

$iAction = $_REQUEST['action'];
$sJson = $_REQUEST['json'];

x("iAction = $iAction)\njson length: ". strlen($sJson));

Action($iAction,$sJson);

xx();

function Action($iAction,$sJson)
{
    global $oConfig;
    x("Action($iAction):\n$sJson");

    $oJson = json_decode($sJson);
    x("oJson\n:".print_r($oJson,true));

    switch ($iAction)
    {
        case 1: // load tree
            $oRet = (object) array('sTree' => ''    , 'sHomeUrl' => '');


            if ($oConfig->sRootOrg)
            {
                require("phpFileTree/php_file_tree.php");

                $aWhitlist = explode(",",$oConfig->sWhitelist);
                $oRet->sTree = php_file_tree($oConfig->sRootOrg, "javascript:CallIDE($oJson->iId,2,'[link]');",$aWhitlist);
                x("load tree:\n$oRet->sTree");
            }
            $oRet->sRootOrg = $oConfig->sRootOrg;
            $oRet->sHomeUrl = $oConfig->sHomepage;

            if ($oConfig->sRootSave)
            {
                $aOpen = GetDirR($oConfig->sRootSave,$oConfig->sRootSave,$oConfig->sRootOrg."/");
                x("aFile\n:".print_r($aOpen,true));
                $oRet->aOpen = $aOpen;

            }    
            echo json_encode($oRet);
            return;
    case 2: // load file

        $sPath = $sJson;
        if ($sExt = HasAccess($sPath,FALSE))
            return Error("no read access to $sPath");

        $oRet = (object) array("bOrg" => true);
        if ($oConfig->sRootSave)
        {
            $sFile = substr($sPath,strlen($oConfig->sRootOrg));
            x("load $sFile from sRootSave = $oConfig->sRootSave");

            $sPath = $oConfig->sRootSave . $sFile;
            if (file_exists($sPath))
                $oRet->bOrg = false;
            else
            {
                x("$sPath does not exist yet");
                $sPath = $sJson;
            }
        }
        if (Load($sPath,$s))
            $oRet->sFile = $s;
        else
            $oRet->sError = $s;

        echo json_encode($oRet);
        return;
    case 4: // save Files
        $oRet = (object) array('aSaved' => array()    , 'hNot' => array(), 'bOrg' => (!$oConfig->sRootSave));
        foreach($oJson AS $i => $o)
        {
            x("checking $o->m_sPath");
            if ($sExt = HasAccess($o->m_sPath,TRUE))
            {
                $oRet->hNot[$sExt] = 1;
                return;
            }

            $sPath = $o->m_sPath;
            if ($oConfig->sRootSave)
            {
                $sFile = substr($sPath,strlen($oConfig->sRootOrg));
                x("save $sFile to sRootSave = $oConfig->sRootSave");

                $sPath = $oConfig->sRootSave . $sFile;

                $iLast = strrpos($sPath,'/');
                if ($iLast >= 0)
                {
                    x("check folders to exist: $sFolder");
                    $sFolder = substr($sPath,0,$iLast);
                    if (!file_exists($sFolder))
                    mkdir($sFolder, 0777, true);                        
                }
            }
            if (Save($sPath,$o->m_sValue))
                $oRet->aSaved[] = $o->m_sPath;

        }
        echo json_encode($oRet);
        return;

    case 7: // delete file

        $sPath = $sJson;
        $oRet = (object) array();

        if ($sExt = HasAccess($sPath,TRUE))
        {
            $oRet->hNot[$sExt] = 1;
            return;
        }


        if ($oConfig->sRootSave)
        {
            if (!Load($sPath,$s))
                return Error("original file $sPath not found");
            
            $oRet->sValue = $s;

            $sFile = substr($sPath,strlen($oConfig->sRootOrg));
            x("delete $sFile from sRootSave = $oConfig->sRootSave");
            $sPath = $oConfig->sRootSave . $sFile;
        }
        if (!file_exists($sPath))
            return Error("there is no file $sFile to delete.");

        unlink($sPath);
        echo json_encode($oRet);
        return;
    }
}

function HasAccess($sPath,$bModify)
{
    global $oConfig;
    x("HasAccess($sPath,$bModify)");
    if (!preg_match('/([^.]+)$/',$sPath,$aM))
        return "-";  // "" = will allow access to files without extension
        //return Error("no access to files without *.xyz");

    $sExt = $aM[1];
    if ($bModify && $oConfig->sWhitelistSave)
    {
        $aWhite = explode(",",$oConfig->sWhitelistSave);
        x("$sExt in whitelistSave: ".implode(" , ",$aWhite));
        if (array_search($sExt,$aWhite) === FALSE)
            return $sExt;
            //return Error("no modify access to .$sExt files");
    }
    else if ($oConfig->sWhitelist)
    {
        $aWhite = explode(",",$oConfig->sWhitelist);
        x("$sExt in whitelist: ".implode(" , ",$aWhite));
        if (array_search($sExt,$aWhite) === FALSE)
        return $sExt;
        //return Error("no read access to .$sExt files");
    }
    return "";
}

function Error($s)
{
    echo json_encode(array("sError" => $s));
    return FALSE;
}

?>
