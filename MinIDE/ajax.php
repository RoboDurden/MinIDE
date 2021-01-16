<?php

header("Access-Control-Allow-Origin: *");
//header("Access-Control-Allow-Methods: GET, POST, PUT");
//header("Access-Control-Allow-Headers: Content-Type");

//define('C_bCacheLog',	0);
define('C_bNoLog',	0);
define('C_sLogFile',	'ajax.log');

require('_common.php');

if (!isset($_REQUEST['action']))
    die ("ServerMess('no action');");


$iAction = $_REQUEST['action'];
$sJson = $_REQUEST['json'];

x("iAction = $iAction)\njson length: ". strlen($sJson));

Action($iAction,$sJson);

xx();

function Action($iAction,$sJson)
{
    x("Action($iAction)");
    $sJS = "";
    switch ($iAction)
    {
        case 1: // load tree
            require("phpFileTree/php_file_tree.php");
            echo php_file_tree("mode/..", "javascript:CallIDE('[link]');");
        return;
    case 2: // load tree
        if (Load($sJson,$s))
            echo $s;
        return;
    }
}
            



?>
