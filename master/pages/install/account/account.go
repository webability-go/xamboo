package main

import (
	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/server/assets"
)

func Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	// If config already done, CANNOT call this page (error)
	installed, _ := ctx.Sysparams.GetBool("installed")
	if installed {
		return "Error: system already installed"
	}

	// PAGE depends on COUNTRY variable (if already selected) or not
	L := ctx.Request.Form.Get("LANGUAGE")
	C := ctx.Request.Form.Get("COUNTRY")
	// verify validity of L,C

	//	bridge.EntityLog_LogStat(ctx)
	params := &xcore.XDataset{
		"LANGUAGE": L,
		"COUNTRY":  C,

		"#": language,
	}

	return template.Execute(params)
}

/*
class masteraccountinstall extends \common\WAApplication
{
  private $COUNTRY;

  public function __construct($template, $language)
  {
    parent::__construct($template, $language);

    $knowncountries = $this->base->getLocalCountries();

    $this->base->Language = $this->base->HTTPRequest->getParameter('LANGUAGE', \xamboo\Validator::REGEXP, '/^[a-z][a-z]$/');
    // we should check against known languages
    if (!isset($knowncountries[$this->base->Language]))
      throw new \throwables\masterError('Error: the language does not exist');

    $this->COUNTRY = $this->base->HTTPRequest->getParameter('COUNTRY', \xamboo\Validator::REGEXP, '/^[a-z][a-z]$/');
    // we should check against known countries
    if (!isset($knowncountries[$this->base->Language]['countries'][$this->COUNTRY]))
      throw new \throwables\masterError('Error: the country does not exist');
  }

  // we add our own parameters to application
  public function getParameters($engine, $params)
  {
    return array('LANGUAGE' => $this->base->Language, 'COUNTRY' => $this->COUNTRY,
                 'FORM' => $this->getForm());
  }

  public function getForm()
  {
    // personalize the script
    if (file_exists('./install.script.php'))
    {
      require 'install.script.php';
    }

    // then we create the mask object
    $M = new \dommask\DomMask(null, null, $this);
    $M->maskid = 'formaccount';
    $M->mode = \dommask\DomMask::INSERT;
    $M->variables = array('COUNTRY' => $this->COUNTRY, 'LANGUAGE' => $this->base->Language);

    $M->alertmessage = '##mask.errormessage##';
    $M->servermessage = '##mask.servermessage##';
    $M->titles[\dommask\DomMask::INSERT] = '##mask.titleinsert##';
    $M->titles[\dommask\DomMask::VIEW] = '##mask.titleview##';

    // on success, we show the div with data and put the link to reload the page
    $M->jsonsuccess = <<<EOF
function(params)
{
  WA.\$N('titleform').hide();
  WA.\$N('titleconfirmation').show();
  WA.\$N('continue').show();
  WA.toDOM('mastermaininstall|single|step1').className = 'installstepdone';
  WA.toDOM('mastermaininstall|single|step1').onclick = null;
  WA.toDOM('mastermaininstall|single|step2').className = 'installstepdone';
  WA.toDOM('mastermaininstall|single|step3').className = 'installstepactual';
}
EOF;

    // then we create each field
    $ifserial = true;
    $defserial = '00000000000000000000';
    if (isset($showserial))
    {
      $ifserial = !!$showserial;
    }
    if (isset($forceserial))
    {
      $defserial = $forceserial;
    }

    if ($ifserial)
    {
      // serial
      $F = new \dommask\DomMaskTextField('serial');
      $F->title = '##serial.title##';
      $F->helpdescription = '##serial.help.description##';
      $F->notnullmodes = 1;
      $F->statusnotnull = '##serial.status.notnull##';
      $F->size = 200;
      $F->minlength = 20;
      $F->maxlength = 20;
      $F->urlvariable = 'serial';
      $F->format = $F->formatjs = '^[a-z|A-Z|0-9]{20}$';
      $F->statusbadformat = '##serial.status.badformat##';
      $F->default = $defserial;
      $M->addMaskField($F);
    }
    else
    {
      $M->variables['serial'] = $defserial;
    }

    // locale
    $F = new \dommask\DomMaskTextField('locale');
    $F->title = '##locale.title##';
    $F->helpdescription = '##locale.help.description##';
    $F->notnullmodes = 1;
    $F->statusnotnull = '##locale.status.notnull##';
    $F->maxlength = 200;  // chars
    $F->urlvariable = 'locale';
    $F->default = setlocale(LC_ALL, "0");
    $M->addMaskField($F);

    // timezone
    $mytimezone = date_default_timezone_get();
    static $regions = array(
      'Africa' => DateTimeZone::AFRICA,
      'America' => DateTimeZone::AMERICA,
      'Antarctica' => DateTimeZone::ANTARCTICA,
      'Asia' => DateTimeZone::ASIA,
      'Atlantic' => DateTimeZone::ATLANTIC,
      'Europe' => DateTimeZone::EUROPE,
      'Indian' => DateTimeZone::INDIAN,
      'Pacific' => DateTimeZone::PACIFIC
    );
    $z = array();
    foreach ($regions as $name => $mask)
    {
      $tz = DateTimeZone::listIdentifiers($mask);
      foreach($tz as $zone)
      {
        $z[$zone] = $zone;
        // bug: default timezone gets the timezone with uppercases different that the official list !!!
        if (strtolower($mytimezone) == strtolower($zone))
          $mytimezone = $zone;
      }
    }
    asort($z);

    $F = new \dommask\DomMaskLOOField('timezone');
    $F->title = '##timezone.title##';
    $F->helpdescription = '##timezone.help.description##';
    $F->notnullmodes = 1;
    $F->statusnotnull = '##timezone.status.notnull##';
    $F->urlvariable = 'timezone';
    $F->options = $z;
    $F->default = $mytimezone;
    $M->addMaskField($F);

    // Master dir
    $F = new \dommask\DomMaskTextField('masterdir');
    $F->title = '##masterdir.title##';
    $F->helpdescription = '##masterdir.help.description##';
    $F->notnullmodes = 1;
    $F->statusnotnull = '##masterdir.status.notnull##';
    $F->size = 500;
    $F->maxlength = 255;
    $F->urlvariable = 'masterdir';
    $F->default = getcwd() . '/';
    $M->addMaskField($F);

    // Master domain
    $F = new \dommask\DomMaskTextField('masterdomain');
    $F->title = '##masterdomain.title##';
    $F->helpdescription = '##masterdomain.help.description##';
    $F->notnullmodes = 1;
    $F->statusnotnull = '##masterdomain.status.notnull##';
    $F->size = 500;
    $F->maxlength = 255;
    $F->urlvariable = 'masterdomain';
    $F->default = 'http://' . $_SERVER["SERVER_NAME"];
    $M->addMaskField($F);

    // username
    $F = new \dommask\DomMaskTextField('username');
    $F->title = '##username.title##';
    $F->helpdescription = '##username.help.description##';
    $F->notnullmodes = 1;
    $F->statusnotnull = '##username.status.notnull##';
    $F->minlength = 4;
    $F->maxlength = 80;
    $F->statustooshort = '##username.status.tooshort##';
    $F->urlvariable = 'username';
    $M->addMaskField($F);

    // password
    $F = new \dommask\DomMaskPWField('password');
    $F->title = '##password.title##';
    $F->helpdescription = '##password.help.description##';
    $F->notnullmodes = 1;
    $F->statusnotnull = '##password.status.notnull##';
    $F->maxlength = 80;
    $F->minlength = 4;
    $F->statustooshort = '##password.status.tooshort##';
    $F->urlvariable = 'password';
    $M->addMaskField($F);

    // email
    $F = new \dommask\DomMaskMailField('email');
    $F->title = '##email.title##';
    $F->helpdescription = '##email.help.description##';
    $F->notnullmodes = 1;
    $F->statusnotnull = '##email.status.notnull##';
    $F->maxlength = 200;  // chars
    $F->urlvariable = 'email';
    $M->addMaskField($F);

    $F = new \dommask\DomMaskButtonField('submit');
    $F->action = 'submit';
    $F->authmodes = 1; // insert
    $F->title = '##form.continue##';
    $M->addMaskField($F);

    $F = new \dommask\DomMaskButtonField('reset');
    $F->action = 'reset';
    $F->authmodes = 1; // insert + view
    $F->title = '##form.reset##';
    $M->addMaskField($F);

    return $M->code()->compile();
  }

  public function selectAccount($key)
  {
    return array();
  }

  public function formaccount($engine, $params)
  {
    $language = $this->getLanguage($engine, $params);

    $serial = $this->base->HTTPRequest->getParameter('serial');
    $username = $this->base->HTTPRequest->getParameter('username');
    $password = $this->base->HTTPRequest->getParameter('password');
    $email = $this->base->HTTPRequest->getParameter('email');
    $masterdir = $this->base->HTTPRequest->getParameter('masterdir');
    $masterdomain = $this->base->HTTPRequest->getParameter('masterdomain');
    $locale = $this->base->HTTPRequest->getParameter('locale');
    $timezone = $this->base->HTTPRequest->getParameter('timezone');

    $success = true;
    $messages = array();
    $messagetext = '';
    if (!$username)
    {
      $success = false;
      $messages['username'] = $this->language->getEntry('error.username.missing');
      $messagetext .= $this->language->getEntry('error.username.missing');
    }
    if (!$password)
    {
      $success = false;
      $messages['password'] = $this->language->getEntry('error.password.missing');
      $messagetext .= $this->language->getEntry('error.password.missing');
    }
    elseif ($username && $username == $password)
    {
      $success = false;
      $messages['password'] = $this->language->getEntry('error.password.same');
      $messagetext .= $this->language->getEntry('error.password.same');
    }
    if (!$locale)
    {
      $success = false;
      $messages['locale'] = $this->language->getEntry('error.locale.missing');
      $messagetext .= $this->language->getEntry('error.locale.missing');
    }
    else
    {
      $res = setlocale(LC_ALL, $locale);
      if ($res === false)
      {
        $success = false;
        $messages['locale'] = $this->language->getEntry('error.locale.bad');
        $messagetext .= $this->language->getEntry('error.locale.bad');
      }
    }
    if (!$timezone)
    {
      $success = false;
      $messages['timezone'] = $this->language->getEntry('error.timezone.missing');
      $messagetext .= $this->language->getEntry('error.timezone.missing');
    }
    else
    {
      $res = date_default_timezone_set($timezone);
      if ($res === false)
      {
        $success = false;
        $messages['timezone'] = $this->language->getEntry('error.timezone.bad');
        $messagetext .= $this->language->getEntry('error.timezone.bad');
      }
    }
    if (!$masterdir)
    {
      $success = false;
      $messages['masterdir'] = $this->language->getEntry('error.masterdir.missing');
      $messagetext .= $this->language->getEntry('error.masterdir.missing');
    }
    else
    {
      // test existing r/w directory
      // test ending /




    }
    if (!$masterdomain)
    {
      $success = false;
      $messages['masterdomain'] = $this->language->getEntry('error.masterdomain.missing');
      $messagetext .= $this->language->getEntry('error.masterdomain.missing');
    }
    else
    {
      // very existing domain, good syntax etc ?
    }


    if ($success)
    {
      // we need WA code version
      $versioncode = $this->base->getVersionCode();

      // all ok, we save the base configuration
      $base = array(
        'version' => $versioncode->version,
        'versiontype' => $versioncode->versiontype,
        'serial' => $serial,
        'isserialvalid' => true,
        'serialdatevalid' => time(),
        'serialdigest' => null,
        'country' => $this->COUNTRY,

        // locale params
        'locale' => $locale,
        'timezone' => $timezone,
        'defdirmask' => 0755,
        'deffilemask' => 0644,

        // directories
        'BASEDIR' => $this->base->config->BASEDIR,
        'REPOSITORYDIR' => $this->base->config->REPOSITORYDIR,
        'MASTERDIR' => $masterdir,
        'ADMINDIR' => $masterdir,
        'SITEDIR' => $masterdir,
        'CDNDIR' => $masterdir,
        'APIDIR' => $masterdir,

        'MASTERDOMAIN' => $masterdomain,
        'ADMINDOMAIN' => $masterdomain,
        'SITEDOMAIN' => $masterdomain,
        'CDNDOMAIN' => $masterdomain,
        'APIDOMAIN' => $masterdomain,

        'SHMLOAD' => $this->base->SHMLOAD,
        'SHMSIZE' => $this->base->SHMSIZE,
        'SHMID' => $this->base->SHMID,

        'DefaultVersion' => $this->base->DefaultVersion,
        'DefaultLanguage' => $this->base->DefaultLanguage,
        'Version' => $this->base->Version,
        'Language' => $this->base->Language,
      );
      $config = new \xconfig\XConfig(array('entries' => $base));
      $this->base->writeConfig('base', $config);

      $master = array(
        // xamboo main params
        'PAGESDIR' => $this->base->PAGESDIR,
        'PAGESCONTAINER' => $this->base->PAGESCONTAINER,
        'SKIN' => $this->base->SKIN,
        'mainpage' => 'master',
        'errorpage' => 'error',
        'errorblock' => 'error/error-block',
        'acceptpathparameters' => 'yes',

        // super admin login data
        'user' => $username,
        'password' => md5($password),
        'email' => $email,

        // 'cookiesize' => 24, // size of cookie, can be added
        'timeout' => 600, // 10 minutes timeout
      );

      $config = new \xconfig\XConfig(array('entries' => $master));
      $this->base->writeConfig('master', $config);

      // modules
      $config = new \xconfig\XConfig(null);
      $this->base->writeConfig('modules', $config);

      $messages['text'] = $this->language->getEntry('success');
    }
    else
      $messages['text'] = $messagetext;

    return array('success' => $success, 'messages' => $messages, 'popup' => false);
  }

}
*/
