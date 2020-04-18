package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/xml"
	"fmt"
	"io/ioutil"

	"github.com/webability-go/xcore/v2"
	"github.com/webability-go/xdommask"

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
	// TODO(phil)

	mask := getMask(L, C).Compile()
	xmlmask, _ := xml.Marshal(mask)
	params := &xcore.XDataset{
		"FORM": string(xmlmask),

		"#": language,
	}

	fmt.Println("FORM:", params)

	return template.Execute(params)
}

func getMask(lang string, country string) *xdommask.Mask {

	mask := xdommask.NewMask("formaccount")
	mask.Mode = xdommask.INSERT
	mask.AuthModes = xdommask.INSERT | xdommask.VIEW
	mask.Variables["COUNTRY"] = country
	mask.Variables["LANGUAGE"] = lang

	mask.AlertMessage = "##mask.errormessage##"
	mask.ServerMessage = "##mask.servermessage##"
	mask.InsertTitle = "##mask.titleinsert##"
	mask.ViewTitle = "##mask.titleview##"

	mask.SuccessJS = `
function(params)
{
WA.$N('titleform').hide();
WA.$N('titleconfirmation').show();
WA.$N('continue').show();
WA.toDOM('install|single|step1').className = 'installstepdone';
WA.toDOM('install|single|step1').onclick = null;
WA.toDOM('install|single|step2').className = 'installstepdone';
WA.toDOM('install|single|step3').className = 'installstepactual';
}
`
	// serial
	f1 := xdommask.NewTextField("serial")
	f1.Title = "##serial.title##"
	f1.HelpDescription = "##serial.help.description##"
	f1.NotNullModes = xdommask.INSERT
	f1.AuthModes = xdommask.INSERT | xdommask.VIEW
	f1.HelpModes = xdommask.INSERT
	f1.ViewModes = xdommask.VIEW
	f1.StatusNotNull = "##serial.status.notnull##"
	f1.Size = "200"
	f1.MinLength = 20
	f1.MaxLength = 20
	f1.URLVariable = "serial"
	f1.Format = "^[a-z|A-Z|0-9]{20}$"
	f1.FormatJS = "^[a-z|A-Z|0-9]{20}$"
	f1.StatusBadFormat = "##serial.status.badformat##"
	f1.DefaultValue = "00000000000000000000"
	mask.AddField(f1)

	// username
	f4 := xdommask.NewTextField("username")
	f4.Title = "##username.title##"
	f4.HelpDescription = "##username.help.description##"
	f4.NotNullModes = xdommask.INSERT
	f4.AuthModes = xdommask.INSERT | xdommask.VIEW
	f4.HelpModes = xdommask.INSERT
	f4.ViewModes = xdommask.VIEW
	f4.StatusNotNull = "##username.status.notnull##"
	f4.MinLength = 4
	f4.MaxLength = 80
	f4.StatusTooShort = "##username.status.tooshort##"
	f4.URLVariable = "username"
	f4.DefaultValue = ""
	mask.AddField(f4)

	// password
	f5 := xdommask.NewPWField("password")
	f5.Title = "##password.title##"
	f5.HelpDescription = "##password.help.description##"
	f5.NotNullModes = xdommask.INSERT
	f5.AuthModes = xdommask.INSERT | xdommask.VIEW
	f5.HelpModes = xdommask.INSERT
	f5.ViewModes = xdommask.VIEW
	f5.StatusNotNull = "##password.status.notnull##"
	f5.MaxLength = 80
	f5.MinLength = 4
	f5.StatusTooShort = "##password.status.tooshort##"
	f5.URLVariable = "password"
	f5.DefaultValue = ""
	mask.AddField(f5)

	// email
	f6 := xdommask.NewMailField("email")
	f6.Title = "##email.title##"
	f6.HelpDescription = "##email.help.description##"
	f6.NotNullModes = xdommask.INSERT
	f6.AuthModes = xdommask.INSERT | xdommask.VIEW
	f6.HelpModes = xdommask.INSERT
	f6.ViewModes = xdommask.VIEW
	f6.StatusNotNull = "##email.status.notnull##"
	f6.MaxLength = 200 // chars
	f6.URLVariable = "email"
	f6.DefaultValue = ""
	mask.AddField(f6)

	f7 := xdommask.NewButtonField("", "submit")
	//	f7.Action = "submit"
	f7.AuthModes = xdommask.INSERT // insert
	f7.TitleInsert = "##form.continue##"
	mask.AddField(f7)

	f8 := xdommask.NewButtonField("", "reset")
	//	f8.Action = "reset"
	f8.AuthModes = xdommask.INSERT // insert + view
	f8.TitleInsert = "##form.reset##"
	mask.AddField(f8)

	return mask
}

func Formaccount(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, e interface{}) interface{} {

	L := ctx.Request.Form.Get("LANGUAGE")
	C := ctx.Request.Form.Get("COUNTRY")
	serial := ctx.Request.Form.Get("serial")
	username := ctx.Request.Form.Get("username")
	password := ctx.Request.Form.Get("password")
	email := ctx.Request.Form.Get("email")

	// check params ok
	success := true
	messages := map[string]string{}
	messagetext := ""
	if username == "" {
		success = false
		messages["username"] = language.Get("error.username.missing")
		messagetext += language.Get("error.username.missing")
	}
	if password == "" {
		success = false
		messages["password"] = language.Get("error.password.missing")
		messagetext += language.Get("error.password.missing")
	}
	if username != "" && username == password {
		success = false
		messages["password"] = language.Get("error.password.same")
		messagetext += language.Get("error.password.same")
	}

	if success {
		// write config file
		// simulate load of config file into Engine.Host.Config till next system restart
		generateConfig(ctx, L, C, serial, username, password, email)
		messages["text"] = language.Get("success")
	} else {

		messages["text"] = messagetext
	}

	return map[string]interface{}{
		"success": success, "messages": messages, "popup": false,
	}
}

func GetMD5Hash(text string) string {
	hasher := md5.New()
	hasher.Write([]byte(text))
	return hex.EncodeToString(hasher.Sum(nil))
}

func generateConfig(ctx *assets.Context, L string, C string, serial string, username string, password string, email string) {

	md5password := GetMD5Hash(password)

	local := "username=" + username + "\n"
	local += "password=" + md5password + "\n"
	local += "email=" + email + "\n"
	local += "language=" + L + "\n"
	local += "country=" + C + "\n"
	local += "serial=" + serial + "\n"
	local += "installed=yes\n"

	// write local
	resourcesdir, _ := ctx.Sysparams.GetString("resourcesdir")
	path := resourcesdir + "/local.conf"
	ioutil.WriteFile(path, []byte(local), 0644)

	// inject into Host.config
	ctx.Sysparams.MergeString(local)
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
