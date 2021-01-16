<?php

//define('C_bCacheLog',		0);
//define('C_bNoLog',		0);
//define('C_bNoDebug',	0);

error_reporting(E_ERROR | E_WARNING | E_PARSE);

define('MEM_TRUE',FALSE);

define('C_bCacheLog',	isset($_GET['cachelog']) ? $_GET['cachelog'] : 1);
define('C_bNoLog',		isset($_GET['setlog']) ? $_GET['setlog'] : 1);
define('C_bNoDebug',	isset($_GET['setdebug']) ? $_GET['setdebug'] : 1);
define('C_sLogFile',	'log.txt');

define('C_bDebug',	0);

define ('C_bShell',!isset($_SERVER['HTTP_HOST'])	);
define ('C_bOnline', (	C_bShell ? 1 :	($_SERVER['HTTP_HOST'] != 'localhost') && ($_SERVER['SERVER_ADDR'] != '127.0.0.1' ) )	) ;

$g_sMess 	= '';
$g_sDebug	= '';

function microtime_float()
{
    list($usec, $sec) = explode(" ", microtime());
    return ((float)$usec + (float)$sec);
}

$g_iStartTime	= microtime_float();
/******* _common.php ***********************************************************

	DLookup($sFields,$sTables,$sWhere="",$iDebug=0)
		SELECT $sFields FROM $sTables WHERE $sWhere LIMIT 1 
		returns an array of the fields if succeeds
		returns 0 if no result, if ($aRes === 0)
		returns false if a sql error occured, if ($aRes === false)
	ExecSQL($sSql,$iDebug=0)
		executes a sql command like SELECT, returns a handle to fetch results
	DoSQL($sSql,$iDebug=0)
		does a sql command
		returns number of affected rows (may return 0)
		returns false if sql command failed.

	mess($sMess)
		for debugging, outputs $sMessage to screen if(C_bDebug)
	x($sMess,$bReset=0)
		for debugging, outputs $sMessage to log.txt if(!C_bNoLog)
	Add2Array(&$ra,$vNew)
		simple little stupid helper function to add $vNew to array $ra, if new
	TimestampAdd($sT,$iS)
		Adds $iS seconds to the timestamp, does it properly :-)
	Timestamp()
		returns a timestamp like "20051231235900"
	Save($sPath,$sData)
		basic function to save data to a file
	Load($sPath,&$sData)
		basic function to load data from a file
	TasksDefault()
		to assure that a $_REQUEST field is allways set

********************************************************************************/


//error_reporting(E_NOTICE);

x("hello world :-) " . Timestamp(),1);


foreach($_GET AS $sKey => $sValue)	x("_GET: $sKey => $sValue");
//foreach($_POST AS $sKey => $sValue)	x("_POST: $sKey => $sValue");
foreach($_COOKIE AS $sKey => $sValue)	x("__COOKIE: $sKey => $sValue");
//foreach($_REQUEST AS $sKey => $sValue)	x("_REQUEST: $sKey => $sValue");


foreach($_FILES AS $sKey => $aF)
{
	x("_FILES: $sKey => $aF");

	foreach($aF AS $sKey => $sVal)
	{
		x("file $sKey: $sKey => $sVal<br>");
	}
}					


foreach($_SERVER AS $sKey => $sValue)	x("_SERVER: $sKey => $sValue<br>");
foreach($_ENV AS $sKey => $sValue)	x("_ENV: $sKey => $sValue<br>");


x('online : '.C_bOnline);



function DLookup($sFields,$sTables,$sWhere="",$iDebug=0,$cFetch=MYSQL_NUM)
{
	global $g_oDb;
	if ($sWhere)
	{
		$sSql = "SELECT $sFields FROM $sTables WHERE $sWhere LIMIT 1";
	}
	else
	{
		$sSql = "SELECT $sFields FROM $sTables LIMIT 1";
	}
	if ($iDebug)
	{
		mess("DLookup( $sSql )");
		if ($iDebug == 2)
		{
			x("DLookup:\n$sSql");
		}
	}

    $hResult = mysql_query($sSql,$g_oDb);
    if ($hResult)
	{    
	    $aRes = mysql_fetch_array($hResult, $cFetch);
	    $iRows = mysql_num_rows($hResult);
		if ($iDebug)
		{
			mess("rows = $iRows: ". (($iRows>1) ? implode(' , ',$aRes): ''));
			if ($iDebug == 2)
			{
				x("rows = $iRows: ". (($iRows>1) ? implode(' , ',$aRes): ''));
			}
		}
	    mysql_free_result($hResult);

		if (!$iRows)
		{
			return 0;
		}
		return $aRes;
    }
	else	MailError("DoLookup: $sSql",$sSql);
    
	return false;
}

function ExecSQL($sSql,$iDebug=0)
{
	global $g_oDb;
	if ($iDebug)
	{
		mess($sSql);
		if ($iDebug == 2)
		{
			x($sSql);
		}
	}
	if (!$sSql)
	{
		mess('error ExecSQL, no sql string');
		return 0;
	}
		
	$hResult = mysql_query($sSql,$g_oDb);
	if (!$hResult)	MailError("ExecSql: $sSql",$sSql);

	if ($iDebug)
	{
		if ($hResult)
		{
			$iRows = mysql_num_rows($hResult);
		}
		else
		{
			$iRows = 0;
		}
		mess("rows = $iRows");
		if ($iDebug == 2)
		{
			x("rows = $iRows");
		}
	}
	
	return $hResult;
}


function DoSQL($sSql,$iDebug=0)
{
	global $g_oDb;
	$iRows = 0;
	if ($iDebug)
	{
		mess($sSql);
		if ($iDebug == 2)
		{
			x($sSql);
		}
	}

	for ($i=3; $i>0; $i--)
	{
	    $bSuccess = mysql_query($sSql,$g_oDb);
	    if ($bSuccess)
		{
			$iRows = mysql_affected_rows($g_oDb);
			if ($iDebug)
			{
				$sMess = 'success, affected rows: '.$iRows;
				mess($sMess);
				if ($iDebug == 2)
				{
					x($sMess);
				}
			}
			return $iRows;
		}
	}
	//MailError("DoSql 3 retries: $sSql",$sSql);
	
	$sPath = 'sqlFail.txt';
   	$hfile = fopen($sPath, "a");
	if (!$hfile)
	{
		x("the file $sPath could not be opened for appending :-(");
		return 0;
	}
	$sFail = Timestamp(). "\t$sSql\n";
	fwrite($hfile, $sFail);
	fclose($hfile);
	
	return FALSE;
}


function MailError($sSubject,$sBody)
{
	x("********************* MailError($sSubject,$sBody)");
	global $rS;
	$sBody = C_sUrlBase."\n$sBody
	
_GET		= " . print_r($_GET,TRUE) . "
_POST		= " . print_r($_POST,TRUE) . "
_REQUEST	= " . print_r($_REQUEST,TRUE) ;
	

	if (C_bOnline)
	{
		if (mail('robokaputt@yahoo.de',"ERROR $sSubject",$sBody))
			x("error mail sent :-)");
		else	x("error mail failed: $sSubject \n\n$sBody");
	}
	else Error("ERROR $sSubject",0);
}


function TasksDefault()
{
	//global $_REQUEST;
	for ($i=0; $i<func_num_args(); $i+=2)
	{
        if (!array_key_exists(func_get_arg($i),$_REQUEST) ) 
        {
			$_REQUEST[func_get_arg($i)] = func_get_arg($i+1);
		}
	}
}

function mess($sMess)
{
	if (C_bDebug)
	{
		echo($sMess.'<br>');
	}
}

$g_bMessPut = 0;
function xError()
{
	  global $g_bMessPut;
	  $g_bMessPut = 1;
}

function x ($sMess,$bReset=0)
{
  	global $g_sMess,$g_iStartTime;

	//$sMess = (microtime_float() - $g_iStartTime) . "\t$sMess";
	
	if (C_bDebug)
	{
		echo("log: $sMess<br>");
	}
	if (C_bNoLog)
	{
		return 1;
	}

	if (C_bCacheLog)
	{
	    if (strlen($g_sMess) > 1000000)	$g_sMess = substr($g_sMess,10000);
		$g_sMess .= $sMess."\n";
		return 1;
	}

  	$sMode = 'a';
	if ($bReset)
	{
	  	$sMode = 'w';
	}
    $hfile = fopen(C_sLogFile, $sMode);
	if (!$hfile)
	{
		mess("log file ".C_sLogFile." could not be opened (access=$sMode) :-(");
		return 0;
	}
	fwrite($hfile, $sMess."\n");
	fclose($hfile);
	return 1;
}

function xx()
{
  	global $g_sMess,$g_iStartTime,$g_bMessPut;

	$sMess = 'close log: '.TimeStamp(). "\tduration [s]: " . (microtime_float() - $g_iStartTime);

	if (C_bCacheLog)
	{
        $hfile = fopen(C_sLogFile, 'w');
		if (!$hfile)
		{
			mess("log file " . C_sLogFile . " could not be opened for write :-(");
			return 0;
		}
		$g_sMess .= $sMess;
		fwrite($hfile, $g_sMess);
		fclose($hfile);

		if ($g_bMessPut)
			file_put_contents('error.log',$g_sMess);
	}
	else x($sMess);
}


function _GetFileSave($s)
{
 	return strtolower(preg_replace('/[ \s:\-\)]/','_',$s));
}

function Save($sPath,$sData)
{
	x("saving file $sPath ...");
    $hfile = fopen($sPath, "w");
	if (!$hfile)
	{
		x("the file $sPath could not be opened for writing :-(");
		return 0;
	}
	fwrite($hfile, $sData);
	fclose($hfile);
	 //$bSuccess = chmod($sPath,0666);
	 //x("success :-) and chmodded to 0666: success=$bSuccess");

	return 1;
}

function Load($sPath,&$sData)
{
  	x("load file '$sPath'");
	//$sData = file_get_contents($sPath);
	//$sData = implode ('', file ($sPath));

	error_reporting(E_ERROR | E_PARSE);
    $sData = file_get_contents($sPath);
	error_reporting(E_ERROR | E_WARNING | E_PARSE);

	if ($sData)
	{
		return 1;
	}
	else
	{
		x("**** file '$sPath' not found or empty");
		return 0;
	}
}


function GetUnixTime($sT)
{
	// int mktime ( int Stunde, int Minute, int Sekunde, int Monat, int Tag, int Jahr [, int is_dst])
	// 2005 12 31 23 59 00
	if (strlen($sT) == 19)
	{
	  	// 2006-07-08 19:34:56
		return mktime(substr($sT,11,2),substr($sT,14,2),substr($sT,17,2),substr($sT,5,2),substr($sT,8,2),substr($sT,0,4));
	}
	return mktime(substr($sT,8,2),substr($sT,10,2),substr($sT,12,2),substr($sT,4,2),substr($sT,6,2),substr($sT,0,4));
}

function TimestampAdd($sT,$iS)
{
	return date('Y-m-d H:i:s',$iS+GetUnixTime($sT));
}

function Timestamp($iUTime=0)
{
	if ($iUTime)
	{
		return date('Y-m-d H:i:s',$iUTime);	// YmdHis
	}
	return date('Y-m-d H:i:s');	// YmdHis
}

function _GetDate($sT,$bNoHours=0,$sFormat='j.n.Y H:i')
{
  	x("_GetDate($sT,$bNoHours,$sFormat)");
  	if ($bNoHours)
  	{
		$sFormat = 'j.n.Y';
	}


	x("_GetDate($sT)");
	if (!$sT)
	{
	  	return '0000-00-00 00:00:00';
		//return date($sFormat);
	}
	
	// int mktime ( int Stunde, int Minute, int Sekunde, int Monat, int Tag, int Jahr [, int is_dst])
	// 2005 12 31 23 59 00
  	if (substr($sT,0,4) < 1970)
  	{
	 	return '';	// --.--.----   
	 	//return date($sFormat);   
	}
	if (strlen($sT) == 19)
	{
		return date($sFormat,mktime(substr($sT,11,2),substr($sT,14,2),substr($sT,17,2),substr($sT,5,2),substr($sT,8,2),substr($sT,0,4)));
	}
  	x("last option: '$sT','$sFormat'");
	return date($sFormat,mktime(substr($sT,8,2),substr($sT,10,2),substr($sT,12,2),substr($sT,4,2),substr($sT,6,2),substr($sT,0,4)));

}



// Usern mit einer PHP-Version vor 4.3.0 hilft folgender Workaround:
function _UnHtmlEntities($string)
{
    // replace numeric entities
    $string = preg_replace('~&#x([0-9a-f]+);~ei', 'chr(hexdec("\\1"))', $string);
    $string = preg_replace('~&#([0-9]+);~e', 'chr(\\1)', $string);
    // replace literal entities
    $trans_tbl = get_html_translation_table(HTML_ENTITIES);
    $trans_tbl = array_flip($trans_tbl);
    return strtr($string, $trans_tbl);
}

function AddMessX()
{
  
}

function _explode($sSep,$s,$iFields,$vDefault)
{
	return array_slice(array_pad(explode($sSep,$s,$iFields),$iFields,$vDefault),0,$iFields);
}

function _addcslashes(&$arr_r,$sCharlist="\\\"\n\r")
{
 foreach ($arr_r as &$val) is_array($val) ? _addcslashes($val,$sCharlist):$val=addcslashes($val,$sCharlist);
 unset($val);
}

function preg_errtxt($errcode)
{
    static $errtext;

    if (!isset($errtxt))
    {
        $errtext = array();
        $constants = get_defined_constants(true);
        foreach ($constants['pcre'] as $c => $n) if (preg_match('/_ERROR$/', $c)) $errtext[$n] = $c;
    }

    return array_key_exists($errcode, $errtext)? $errtext[$errcode] : NULL;
}

function urlencodeOld($s) {
    return str_replace(
    	array('ä','Ä','ö','Ö','ü','Ü','ß'), 
    	array('%E4','%C4','%F6','%D6','%FC','%DC','%DF'), 
    	$s);

	}


function GetMemUsage()
{
	return round(memory_get_usage(MEM_TRUE)/1048576,1);
}


function MailTo($to,$subject,$message,$reply="")
{
	if (!$reply) 	$reply = "robo@robo4future.de";

	$from = "robo@robo4uture.de";
	
	$headers = 'From: '. $from . "\r\n" .
	    'Reply-To: '. $reply . "\r\n" .
	    'X-Mailer: PHP/' . phpversion();

	x($headers);

	$aTo = explode(',',$to);
	$iSent = 0;
	foreach($aTo AS $sTo)
	{
		if (C_bOnline)
		{
				if (mail($sTo, $subject, $message, $headers))
					$iSent++;
		}
		else $iSent++;
		x("EmailTo(reply:$reply, to:$sTo, subject:$subject); iSent=$iSent:\n$message");
	}
	return $iSent;
}

function Pwd($length=10,$chars="") 
{ 
    if($chars=="")
		$chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ0123456789"; 
    srand((double)microtime()*1000000); 
    $i = 0; 
    $pass = '' ; 
 
    while ($i < $length) 
    { 
        $num = rand() % strlen($chars); 
        $tmp = substr($chars, $num, 1); 
        $pass = $pass . $tmp; 
        $i++; 
    } 
    return $pass; 
}

function CheckFolders($aFolder)
{
	foreach($aFolder AS $sFolder)
		if (!is_dir($sFolder))
		  mkdir($sFolder);
}

?>