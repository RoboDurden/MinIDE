<?php

//define('C_bCacheLog',		0);
//define('C_bNoLog',		0);
//define('C_bNoDebug',	0);

error_reporting(E_ERROR | E_WARNING | E_PARSE);

define('MEM_TRUE',FALSE);
//error_reporting(E_NOTICE);

define('C_bCacheLog',	isset($_GET['cachelog']) ? $_GET['cachelog'] : 1);
define('C_bNoLog',		isset($_GET['setlog']) ? $_GET['setlog'] : 1);
define('C_bNoDebug',	isset($_GET['setdebug']) ? $_GET['setdebug'] : 1);
define('C_sLogFile',	'log.txt');

define('C_bDebug',	0);

define ('C_bShell',!isset($_SERVER['HTTP_HOST'])	);
define ('C_bOnline', (	C_bShell ? 1 :	($_SERVER['HTTP_HOST'] != 'localhost') && ($_SERVER['SERVER_ADDR'] != '127.0.0.1' ) )	) ;

$g_sMess 	= '';

function microtime_float()
{
    list($usec, $sec) = explode(" ", microtime());
    return ((float)$usec + (float)$sec);
}

$g_iStartTime	= microtime_float();
x("hello world :-) " . Timestamp(),1);
x('online : '.C_bOnline);


foreach($_GET AS $sKey => $sValue)	x("_GET: $sKey => $sValue");
//foreach($_POST AS $sKey => $sValue)	x("_POST: $sKey => $sValue");
//foreach($_COOKIE AS $sKey => $sValue)	x("__COOKIE: $sKey => $sValue");
//foreach($_REQUEST AS $sKey => $sValue)	x("_REQUEST: $sKey => $sValue");
foreach($_FILES AS $sKey => $aF)
{
	x("_FILES: $sKey => $aF");
	foreach($aF AS $sKey => $sVal)
		x("file $sKey: $sKey => $sVal<br>");
}					
//foreach($_SERVER AS $sKey => $sValue)	x("\$_SERVER['$sKey'] = $sValue<br>");
//foreach($_ENV AS $sKey => $sValue)	x("\$_ENV['$sKey'] = $sValue<br>");


$hConfig = array( 
	"pPassword" => ""
);

define('CONFIG_PATH','configData.php');

function LoadConfig($sPath=false)
{
	$hConfig = $sPath ? array() : array( "sRoot" => "mode/.."
	, "sBlacklist" => ""
	, "sWhitelist" => ""
	, "sWhitelistSave" => "htm,js,css,txt"
	, "pPassword" => ""
	, "pPasswordNew1" => ""
	, "pPasswordNew2" => ""
	);
	
	if (Load($sPath ? $sPath : CONFIG_PATH,$sJson))
	{
		$sJson = substr($sJson,8,-5);
		x("LoadConfig()");	// : $sJson
		$hConfig = json_decode($sJson, true);
		if ($hConfig === null) 
			die ("could not parse ".CONFIG_PATH);
	}
	return (object)$hConfig;
}

function  SaveConfig($hConfig,$sPath=false)
{
    $sJson = str_replace('","',"\",\n\"",json_encode($hConfig));
	//x("saving config to ".CONFIG_PATH.": $sJson");
	if (Save($sPath ? $sPath : CONFIG_PATH,"<?php/*\n$sJson\n*/?>"))
		return true;
	return false;
	
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
		die("log file ".C_sLogFile." could not be opened (access=$sMode) :-(");
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
			die("log file " . C_sLogFile . " could not be opened for write :-(");
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

function GetDirR($source,$sBaseRemove="",$sBaseAdd=""){
	$a = array();
    if(is_dir($source)) {
        $dir_handle=opendir($source);
		while($file=readdir($dir_handle))
		{
			if($file!="." && $file!="..")
			{
				if(is_dir($source."/".$file))
				{
					$a = array_merge($a, GetDirR($source."/".$file,$sBaseRemove,$sBaseAdd));
				} 
				else 
				{
					$a[] = $sBaseAdd.substr($source."/".$file,strlen($sBaseRemove)+1);
                }
            }
        }
        closedir($dir_handle);
    } else {
		$a[] = $sBaseAdd.substr($source,strlen($sBaseRemove)+1);
	}
	return $a;
}

?>