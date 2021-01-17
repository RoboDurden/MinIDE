<?php


define('C_IdeRoot',	"mode/.."); // the root folder is hard coded


header("Access-Control-Allow-Origin: *");
//header("Access-Control-Allow-Methods: GET, POST, PUT");
//header("Access-Control-Allow-Headers: Content-Type");

//define('C_bCacheLog',	0);
define('C_bNoLog',	0);
define('C_sLogFile',	'MinIDE.log');

require('_common.php');

if (!isset($_REQUEST['action']))
    die ("ServerMess('no action');");

$oConfig = (object) LoadConfig();


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
            require("phpFileTree/php_file_tree.php");
            $sHtml = php_file_tree($oConfig->sRoot, "javascript:CallIDE(2,'[link]');");
            x("load tree:\n$sHtml");
            echo $sHtml;
        return;
    case 2: // load file
        if (Load($sJson,$s))
            echo $s;
        return;
    case 4: // save Files
        $oRet = (object) array('aSaved' => array()    , 'hNot' => array());
        foreach($oJson AS $i => $o)
        {
            x("checking $o->m_sPath");
            if (preg_match('/([^.]+)$/',$o->m_sPath,$aM))
            {
                $aWhite = explode(",",$oConfig->sWhitelistSave);
                x("$aM[1] in whitelist: ".implode(" , ",$aWhite));
                if (array_search($aM[1],$aWhite) !== FALSE)
                {
                    if (Save($o->m_sPath,$o->m_sValue))
                        $oRet->aSaved[] = $o->m_sPath;
                }
                else
                    $oRet->hNot[$aM[1]] = 1;

            }
        }
        echo json_encode($oRet);
        return;
    }
}


?>
