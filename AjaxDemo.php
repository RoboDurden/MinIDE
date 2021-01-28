<?php

Action($_POST['action'], json_decode($_POST['json'])    );

function Action($iAction,$oDo)
{
	$oRet = (object) array('sError' => false, 'sMess' => "");
    switch ($iAction)
    {
    case 1: // ClickMe
        $oRet->iAnswer = $oDo->iSend +1 ;
        break;
	}
	$sJson = json_encode($oRet);
	echo $sJson;
}
?>
