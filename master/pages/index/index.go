package main

import (
	//	"fmt"

	"github.com/webability-go/xcore/v2"

	"github.com/webability-go/xamboo/server"
	"github.com/webability-go/xamboo/server/assets"

	"github.com/webability-go/xamboo/master/app/bridge"
)

func Run(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, s interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.USER)
	if !ok {
		return ""
	}

	//	bridge.EntityLog_LogStat(ctx)
	params := &xcore.XDataset{
		"#": language,
	}

	return template.Execute(params)
}

func Menu(ctx *assets.Context, template *xcore.XTemplate, language *xcore.XLanguage, s interface{}) interface{} {

	ok := bridge.Setup(ctx, bridge.USER)
	if !ok {
		return ""
	}

	Order := ctx.Request.Form.Get("Order")

	if Order == "get" {
		return getMenu(ctx, s.(*server.Server))
	}
	if Order == "openclose" {

		//    $id = $this->base->HTTPRequest->getParameter('id');
		//    $status = $this->base->HTTPRequest->getParameter('status');
		//    $this->base->security->setParameter('mastertree', $id, $status=='true'?1:0);
	}

	return map[string]string{
		"status": "OK",
	}
}

func getMenu(ctx *assets.Context, s *server.Server) map[string]interface{} {

	rows := []interface{}{}

	config := s.GetFullConfig()

	// Config:
	optr := map[string]interface{}{
		"id":        "config",
		"template":  "config",
		"loadable":  false,
		"closeable": true,
		"closed":    true,
	}
	rows = append(rows, optr)

	//   listeners
	optr = map[string]interface{}{
		"id":        "listeners",
		"template":  "listeners",
		"father":    "config",
		"loadable":  false,
		"closeable": true,
		"closed":    true,
	}
	rows = append(rows, optr)
	for _, l := range config.Listeners {
		opt := map[string]interface{}{
			"id":        "lis-" + l.Name,
			"modid":     l.Name,
			"template":  "listener",
			"name":      l.Name + " [" + l.Protocol + "://" + l.IP + ":" + l.Port + "]",
			"father":    "listeners",
			"loadable":  false,
			"closeable": false,
		}
		rows = append(rows, opt)
	}

	//   Hosts
	optr = map[string]interface{}{
		"id":        "hosts",
		"template":  "hosts",
		"father":    "config",
		"loadable":  false,
		"closeable": true,
		"closed":    true,
	}
	rows = append(rows, optr)
	for _, h := range config.Hosts {
		opt := map[string]interface{}{
			"id":        "hos-" + h.Name,
			"modid":     h.Name,
			"template":  "host",
			"name":      h.Name,
			"father":    "hosts",
			"loadable":  false,
			"closeable": false,
		}
		rows = append(rows, opt)
	}

	//   Engines
	optr = map[string]interface{}{
		"id":        "engines",
		"template":  "engines",
		"father":    "config",
		"loadable":  false,
		"closeable": true,
		"closed":    true,
	}
	rows = append(rows, optr)
	for _, e := range config.Engines {
		opt := map[string]interface{}{
			"id":        "eng-" + e.Name,
			"modid":     e.Name,
			"template":  "engine",
			"name":      e.Name,
			"father":    "engines",
			"loadable":  false,
			"closeable": false,
		}
		rows = append(rows, opt)
	}

	// Containers
	optr = map[string]interface{}{
		"id":        "containers",
		"template":  "containers",
		"loadable":  false,
		"closeable": true,
		"closed":    true,
	}

	rows = append(rows, optr)

	bridge.Containers.Load(ctx)
	list := bridge.Containers.GetContainersList()

	for _, c := range list {
		opt := map[string]interface{}{
			"id":        "cnt-" + c.Name,
			"modid":     c.Name,
			"template":  "container",
			"name":      c.Name,
			"color":     "black",
			"status":    "",
			"father":    "containers",
			"loadable":  false,
			"closeable": true,
			"closed":    true,
		}
		if c.Config == nil {
			opt["status"] = "NUEVO"
		}

		rows = append(rows, opt)

		for _, ct := range c.Contexts {
			opt := map[string]interface{}{
				"id":        "ctx-" + ct.ID,
				"modid":     ct.ID,
				"template":  "context",
				"name":      ct.ID,
				"color":     "black",
				"status":    "",
				"father":    "cnt-" + c.Name,
				"loadable":  false,
				"closeable": false,
			}
			if ct.Config == nil {
				opt["status"] = "NUEVO"
			}
			rows = append(rows, opt)
		}

	}

	/*



	   optr1 := map[string]interface{}{
	   	"id":          "receta-nueva",
	   	"template":    "opcionmenu",
	   	"image":       "opcion.png",
	   	"name":        "Nueva receta",
	   	"page":        "recetas/editor",
	   	"resumen":     "Nueva receta",
	   	"titulo":      "Nueva receta",
	   	"descripcion": "Nueva receta",
	   	"loadable":    false,
	   	"closeable":   false,
	   	"father":      "receta",
	   }

	*/

	return map[string]interface{}{
		"row": rows,
	}

}

/*

class masterindex extends \common\WAApplication
{
  private $baseModuleEntity = null;

  public function __construct($template, $language)
  {
    parent::__construct($template, $language);

    // calling this, the system is installed
    $this->baseModuleEntity = \entities\baseModuleEntity::getInstance();
  }

  private function getTree()
  {
    $globalstatus = $this->base->getGlobalStatus();
    $full = array();

    if ($globalstatus['fglobal'])
    {
      // SI INSTALADO Y TODO OK,
      // PON LOS ACCESOS A LOS SITIOS
      // PON MANTENIMIENTO (CACHES, TABLAS, ARCHIVOS TEMPORALES, ver, borrar)
      // PON LOS MODULES
      // PON LOS CONECTORES
      // PON LAS HERRAMIENTAS
      // PON LA INSTALACION HASTA EL FINAL

      $full[] = array('id' => 'sitelink', 'template' => 'sitelink', 'loadable' => false, 'closeable' => false);
      $full[] = array('id' => 'adminlink', 'template' => 'adminlink', 'loadable' => false, 'closeable' => false);

      $closed = $this->base->user->getParameter('mastertree', 'modules')?true:false;
      $full[] = array('id' => 'modules', 'template' => 'modules', 'loadable' => false, 'closeable' => true, 'closed' => $closed);
      $full = array_merge($full, $this->getModules());

      $full[] = array('id' => 'explorer', 'template' => 'explorer', 'loadable' => false, 'closeable' => false);
      $full[] = array('id' => 'config', 'template' => 'config', 'loadable' => false, 'closeable' => false);
      $full[] = array('id' => 'mypage', 'template' => 'mypage', 'loadable' => false, 'closeable' => false);
      $full[] = array('id' => 'console', 'template' => 'console', 'loadable' => false, 'closeable' => false);

      $full = array_merge($full, $this->getInstallation($globalstatus));
    }
    else
    {
      // SI NO INSTALADO AUN, PON INSTALACION ARRIBA Y ABAJO LAS 4 HERRAMIENTAS
      $full = array_merge($full, $this->getInstallation($globalstatus));

      $full[] = array('id' => 'explorer', 'template' => 'explorer', 'loadable' => false, 'closeable' => false);
      $full[] = array('id' => 'config', 'template' => 'config', 'loadable' => false, 'closeable' => false);
      $full[] = array('id' => 'mypage', 'template' => 'mypage', 'loadable' => false, 'closeable' => false);
      $full[] = array('id' => 'console', 'template' => 'console', 'loadable' => false, 'closeable' => false);
    }

    return array('row' => $full);
  }

  private function getInstallation($gs)
  {
    if ($gs['fglobal'])
    {
      $image = 'installation-ok.png';
      $title = $this->language->getEntry('installation.ok');
    }
    else
    {
      $image = 'installation-error.png';
      $title = $this->language->getEntry('installation.error');
    }

    if ($this->base->user)
      $installclosed = $this->base->user->getParameter('mastertree', 'installation')?true:false;
    else
      $installclosed = false;
    $full = array();
    $full[] = array('id' => 'installation', 'template' => 'installation', 'father' => null, 'image' => $image, 'title' => $title, 'loadable' => false, 'closeable' => true, 'closed' => $installclosed);
    $full = array_merge($full, $this->getMainConnector($gs));
    $full = array_merge($full, $this->getRepository($gs));
    $full = array_merge($full, $this->getSites($gs));
    return $full;
  }

  private function getMainConnector($gs)
  {
    $full = array();
    switch ($gs['fconnector'])
    {
      case 0:
        $title = $this->language->getEntry('connector.repository.no');
        $image = 'connector-no.png';
        $repo = $this->language->getEntry('connector.repository.missing');
        break;
      case 1:
        $title = $this->language->getEntry('connector.repository.ok');
        $image = 'connector-ok.png';
        $names = $this->base->getDatabases();
        $Connectors = $this->base->loadConnectors();
        $repo = $names[$Connectors['main']['type']];
        break;
      case 2:
        $title = $this->language->getEntry('connector.repository.error');
        $image = 'connector-error.png';
        $names = $this->base->getDatabases();
        $Connectors = $this->base->loadConnectors();
        $repo = $names[$Connectors['main']['type']];
        break;
    }

    $full[] = array('id' => 'mainconnector', 'template' => 'mainconnector', 'father' => 'installation', 'uid' => 'main', 'image' => $image, 'title' => $title, 'type' => $repo, 'loadable' => false, 'closeable' => false);
    return $full;
  }

  private function getRepository($gs)
  {
    $full = array();
    switch($gs['frepository'])
    {
      case 0:
        $image = 'repository-noconnector.png';
        $title = $this->language->getEntry('repository.noconnector');
        break;
      case 1:
        $image = 'repository-ok.png';
        $title = $this->language->getEntry('repository.ok');
        break;
      case 2:
        $image = 'repository-no.png';
        $title = $this->language->getEntry('repository.no');
        break;
      case 3:
        $image = 'repository-update.png';
        $title = $this->language->getEntry('repository.update');
        break;
    }

    $full[] = array('id' => 'repository', 'template' => 'repository', 'father' => 'installation', 'image' => $image, 'title' => $title, 'loadable' => false, 'closeable' => false);
    return $full;
  }

  private function getSites($gs)
  {
    $full = array();
    // installed or not ?
    if ($gs['fadmin'] == 1 && $gs['fsite'] == 1)
    {
      $image = 'sites-ok.png';
      $title = $this->language->getEntry('sites.ok');

    }
    else if ($gs['fadmin'] == 0 || $gs['fsite'] == 0)
    {
      $image = 'sites-no.png';
      $title = $this->language->getEntry('sites.no');
    }
    else
    {
      $image = 'sites-update.png';
      $title = $this->language->getEntry('sites.update');
    }

    $full[] = array('id' => 'sites', 'template' => 'sites', 'father' => 'installation', 'image' => $image, 'title' => $title, 'loadable' => false, 'closeable' => false);
    return $full;
  }

  private function getModules()
  {
    $full = array();

    // get all the modules from the directory and check if they are installed
    $installed = $this->baseModuleEntity->readModule(new \dominion\DB_Condition('installed', '=', 1), new \dominion\DB_OrderBy('key', \dominion\DB_OrderBy::ASC));
    // always >= 1 installed, no need to check installed not null
    $modulesinstalled = array();
    foreach($installed as $rec)
      $modulesinstalled[$rec->key] = $rec;

    $full[] = array('id' => 'wa', 'uid' => 'wa', 'modid' => 'wa', 'template' => 'module', 'father' => 'modules', 'name' => 'WA Core', 'icon' => 'module.png', 'status' => '[' . \common\Base::VERSION . ']', 'loadable' => false, 'closeable' => false);

    $modules = $this->baseModuleEntity->getLocalModulesList();
    foreach($modules as $mod => $cart)
    {
      // installed ?
      // to upgrade ?
      // another needed ?
      $status = '';
      if (isset($modulesinstalled[$mod]))
      {
        $status = '[' . $modulesinstalled[$mod]->version . ']';
        $icon = 'module.png';
        $color = 'black';
        // upgrade available ?
        foreach($cart as $num => $c)
        {
          if ($modulesinstalled[$mod]->version <= $num)
            continue;
          else
          {
            // oldest: nothing
            // newest and upgradeable: [upgrade]
            // newset not compatible: nothing
            $installable = $this->moduleInstallable($c, $modulesinstalled);
            if ($installable)
            {
              $icon = 'module-upgradable.png';
              $color = 'orange';
              break;
            }
          }
        }
      }
      else
      {
        // can be installed ?
        $installparty = false;
        foreach($cart as $num => $c)
        {
          $installparty |= $this->moduleInstallable($c, $modulesinstalled);
        }
        $status = $installparty?'['.$this->language['module.available'].']':'['.$this->language['module.missing'].']';
        $icon = $installparty?'module-installable.png':'module-noaction.png';
        $color = 'grey';
      }

//      $closed = $this->base->user->getParameter('mastertree', 'module-' . $mod);
//      if ($closed === null) $closed = true;
      $full[] = array('id' => $mod, 'uid' => $mod, 'modid' => $mod, 'template' => 'module', 'father' => 'modules', 'name' => $mod, 'icon' => $icon, 'color' => $color, 'status' => $status, 'loadable' => false, 'closeable' => false); //, 'closed' => $closed);
      / *
      foreach($cart as $num => $c)
      {
        if (isset($modulesinstalled[$mod]) && $modulesinstalled[$mod]->version == $num)
          $status = '[Instalado]';
        else
        {
          if (isset($modulesinstalled[$mod]))
          {
            // oldest: nothing
            // newest and upgradeable: [upgrade]
            // newset not compatible: nothing
            $status = '';
          }
          else
          {
            $installable = $this->moduleInstallable($c, $modulesinstalled);
            $status = $installable?'['.$this->language['moduleversion.install'].']':'['.$this->language['moduleversion.missing'].']';
          }
        }

        $full[] = array('id' => $mod.'.'.$num, 'uid' => $mod.'.'.$num, 'modid' => $mod, 'versionid' => $num, 'status' => $status, 'template' => 'moduleversion', 'father' => $mod, 'name' => $num, 'loadable' => false, 'closeable' => false);
      }
      * /
    }
    return $full;
  }

  private function moduleInstallable($c, $installed)
  {
    if (!isset($c->modules) || !$c->modules)
      return true;

    foreach($c->modules as $module)
    {
      if (!$module)
        continue;

      // verify this one is installed or not
      $xparts = explode('.', $module);
      if (isset($modulesinstalled[$xparts[0]]))
      {
        // installed, we check the version OK
      }
      else
      {
        return false;
      }
    }
    return true;
  }


  // open/close listener
  public function menu()
  {
    $Order = $this->base->HTTPRequest->getParameter('Order');

    if ($Order == 'get')
    {
      return $this->getTree();
    }
    elseif ($Order == 'openclose')
    {
      $id = $this->base->HTTPRequest->getParameter('id');
      $status = $this->base->HTTPRequest->getParameter('status');
      $this->base->security->setParameter('mastertree', $id, $status=='true'?1:0);
      return array('status' => 'OK');
    }
  }

}

*/
