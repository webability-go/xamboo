
/*
    space3dManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Manager singleton to simulate 3D with DOM nodes playing with zIndex, size and color
    (c) 2008-2010 Philippe Thomassigny

    This file is part of WAJAF

    WAJAF is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WAJAF is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with WAJAF.  If not, see <http://www.gnu.org/licenses/>.
*/

WA.Managers.space3d = new function()
{
  var self = this;
  this.scenes = {};

  this.createScene = createScene;
  function createScene(id, domNode, objects)
  {
    var s = new WA.Managers.space3d._scene3d(id, domNode, objects);
    self.scenes[id] = s;
    return s;
  }

  this.destroyScene = destroyScene;
  function destroyScene(id)
  {
    if (self.scenes[id])
      delete self.scenes[id];
  }

  function destroy()
  {
    self = null;
  }

  eventManager.registerFlush(destroy);
}();

WA.Managers.space3d._spaceTransform = function()
{
  var self = this;
  this.xx = this.yy = this.zz = 1.0;
  this.xy = this.xz = this.yx = this.yz = this.zx = this.zy = 0.0;
  this.translation = {x:0.0,y:0.0,z:0.0};
  this.scale = 2.0;
  this.zeye = 200.0;
  this.zplan = -600.0;
  this.posttranslation = {x:0.0,y:0.0,z:0.0};
  this.deeper = null;
  this.higher = null;

  this.setMatrix = setMatrix;
  function setMatrix(alpha, beta, gamma, scale, invert)
  {
    // pre-calculate to go much faster
    var cosa = Math.cos(alpha);
    var sina = Math.sin(alpha);
    var cosb = Math.cos(beta);
    var sinb = Math.sin(beta);
    var cosg = Math.cos(gamma);
    var sing = Math.sin(gamma);

    /*

    [ xt ]   [ xx yx zx ]   [ xo ]
    [ yt ] = [ xy yy zy ] * [ yo ]
    [ zt ]   [ xz yz zz ]   [ zo ]

    Direct Matrix
    [ xx xy xz ]   [ cos(g) -sin(g) 0 ]   [ cos(b) 0 -sin(b) ]   [ 1   0       0    ]
    [ yx yy yz ] = [ sin(g)  cos(g) 0 ] . [   0    1    0    ] . [ 0 cos(a) -sin(a) ]
    [ zx zy zz ]   [   0       0    1 ]   [ sin(b) 0  cos(b) ]   [ 0 sin(a)  cos(a) ]

    [ xx xy xz ]   [ cos(g)*cos(b) -sin(g) -cos(g)*sin(b) ]   [ 1   0       0    ]
    [ yx yy yz ] = [ sin(g)*cos(b)  cos(g) -sin(g)*sin(b) ] . [ 0 cos(a) -sin(a) ]
    [ zx zy zz ]   [        sin(b)    0            cos(b) ]   [ 0 sin(a)  cos(a) ]

    Inverse Matrix
    [ xx xy xz ]   [ 1   0       0    ]   [ cos(b) 0 -sin(b) ]   [ cos(g) -sin(g) 0 ]
    [ yx yy yz ] = [ 0 cos(a) -sin(a) ] . [   0    1    0    ] . [ sin(g)  cos(g) 0 ]
    [ zx zy zz ]   [ 0 sin(a)  cos(a) ]   [ sin(b) 0  cos(b) ]   [   0       0    1 ]

    [ xx xy xz ]   [ cos(b)           0           -sin(b) ]   [ cos(g) -sin(g) 0 ]
    [ yx yy yz ] = [ -sin(a)*sin(b) cos(a) -sin(a)*cos(b) ] . [ sin(g)  cos(g) 0 ]
    [ zx zy zz ]   [  cos(a)*sin(b) sin(a)  cos(a)*cos(b) ]   [   0       0    1 ]


    */

    if (invert)
    {
      self.xx = scale * cosg*cosb;
      self.xy = scale * -sing*cosb;
      self.xz = scale * -sinb;
      self.yx = scale * (-sina*sinb*cosg + cosa*sing);
      self.yy = scale * (sina*sinb*sing + cosa*cosg);
      self.yz = scale * -sina*cosb;
      self.zx = scale * (cosa*sinb*cosg + sina*sing);
      self.zy = scale * (-cosa*sinb*sing + sina*cosg)
      self.zz = scale * cosa*cosb;
    }
    else
    {
      self.xx = scale * cosg*cosb;
      self.xy = scale * (-sing*cosa - cosg*sinb*sina);
      self.xz = scale * (sing*sina - cosg*sinb*cosa);
      self.yx = scale * sing*cosb;
      self.yy = scale * (cosg*cosa - sing*sinb*sina);
      self.yz = scale * (-cosg*sina - sing*sinb*cosa);
      self.zx = scale * sinb;
      self.zy = scale * cosb*sina;
      self.zz = scale * cosb*cosa;
    }
  }

  this.setTranslationRelative = setTranslationRelative;
  function setTranslationRelative(x, y, z)  // pretranslation only
  {
    self.translation.x += x;
    self.translation.y += y;
    self.translation.z += z;
  }

  this.setTranslation = setTranslation;
  function setTranslation(t, pt)
  {
    self.translation = t;
    self.posttranslation = pt;
  }

  this.setRetroProjection = setRetroProjection;
  function setRetroProjection(eye, plan)
  {
    self.zeye = eye;
    self.zplan = plan;
  }

  this.calculatePoints = calculatePoints;
  function calculatePoints(In, project)
  {
    self.deeper = 1e100;
    self.higher = -1e100;
    var Out = {};
    var i;
    for (var i in In)
    {
      if (In[i] != undefined)
      {
        if (Out[i] == undefined)
          Out[i] = {x:0.0,y:0.0,z:0.0};
        Out[i].x = (In[i].x - self.translation.x) * self.xx + (In[i].y - self.translation.y) * self.yx + (In[i].z - self.translation.z) * self.zx;
        Out[i].y = (In[i].x - self.translation.x) * self.xy + (In[i].y - self.translation.y) * self.yy + (In[i].z - self.translation.z) * self.zy;
        Out[i].z = (In[i].x - self.translation.x) * self.xz + (In[i].y - self.translation.y) * self.yz + (In[i].z - self.translation.z) * self.zz;

        if (project) // retroprojection to the visu
        {
          if (Out[i].z < self.zeye)
          {
            Out[i].x = Out[i].x * (self.zeye - self.zplan) / (self.zeye - Out[i].z);
            Out[i].y = Out[i].y * (self.zeye - self.zplan) / (self.zeye - Out[i].z);
          }
          else
          {
            Out[i].x = Out[i].y = 1e100; // not paint, not seen, out of bounds
          }

          Out[i].x += self.posttranslation.x;
          Out[i].y = self.posttranslation.y - Out[i].y;  // we invert y because of computer screen coordinates
          Out[i].z += self.posttranslation.z;
        }
        else
        {
          Out[i].x += self.posttranslation.x;
          Out[i].y += self.posttranslation.y;
          Out[i].z += self.posttranslation.z;
        }

      }
      if (Out[i].z < self.deeper)
        self.deeper = Out[i].z;
      if (Out[i].z > self.higher)
        self.higher = Out[i].z;
    }
    return Out;
  }
}

WA.Managers.space3d._scene3d = function(id, domNode, objects)
{
  var self = this;
  this.id = id;
  this.domNode = domNode;
  this.objects = objects;

  // 3D
  this.scenealpha = 0.0;                              // 1rst Z axis rotation
  this.scenebeta =  0.0;                              // 2nd  Y axis rotation
  this.scenegamma = 0.0;                              // 3rd  Z axis rotation
  this.scenescale = 1.0;
  this.polygoncalculated = false;                     // true once calculated

  // render
  this.rendersize = true;
  this.rendercolor = true;

  // Points declaration
  this.points = {};
  this.calculatedpoints = null;

  this.ST = new WA.Managers.space3d._spaceTransform();

  // animation
  this.mouse = false;
  this.running = false;
  this.suspended = false;
  this.starttime = 0;
  this.suspendedtime = 0;
  this.timeframe = 50;
  this.timer = null;

  // container
  this.width = 0;
  this.height = 0;
  this.cx = 0;
  this.cy = 0;

  // public mouse status
  this.moving = false;
  this.dragging = false;
  this.percx = 0;
  this.percy = 0;
  this.dragx = 0;
  this.dragy = 0;

  // local animation formulae
  this.timeframediff = 0;

  // ======================================================
  // Nodes creation

  function createnodes()
  {
    // create list of points
    for (var i in self.objects)
    {
      if (self.objects[i].node)
        continue;
      var node = document.createElement('div');
      node.style.position = 'absolute';
      node.style.top = '0px';
      node.style.left = '0px';
      node.innerHTML = self.objects[i].title;
      self.domNode.appendChild(node);
      self.objects[i].node = node;
      self.objects[i].rgb = new RGB(self.objects[i].color);
      self.points[i] = {x: self.objects[i].x, y: self.objects[i].y, z: self.objects[i].z};
    }
  }

  createnodes();

  // default moves

  function basicmovement(tf)
  {
    // dragging takes care itself of the angles
    if (self.dragging)
      return;

    var diff = tf - self.timeframediff;
    self.timeframediff = tf;

    if (!self.moving)
    {
      self.scenealpha += diff / 1300;
      self.scenebeta += diff / 2500;
      self.scenegamma += diff / 3800;
    }
    else
    {
      self.scenegamma += self.percx / 20;
      self.scenebeta -= self.percy / 20;
    }

    self.ST.setMatrix(self.scenealpha, self.scenebeta, self.scenegamma, self.scenescale, true);
  }

  this.formulae = basicmovement;


  // ======================================================
  // animation

  function frame()
  {
    var time = new Date().getTime();
    var diff = time - self.starttime;
    self.formulae(diff);

    draw();

    self.timer = setTimeout(function() { frame(); }, self.timeframe);
  }

  // ======================================================
  // mouse

  function ddlistener(event, group, object, zone, data)
  {
    switch(event)
    {
      case 'start':
        self.dragging = true;
        break;
      case 'drag':
        self.scenebeta = data.xmouse / 50;
        self.scenealpha = -data.ymouse / 50;
        break;
      case 'drop':
        self.dragging = true;
        break;
    }
    self.ST.setMatrix(self.scenealpha, self.scenebeta, self.scenegamma, self.scenescale, true);
    if (!self.running)
      self.draw();
  }

  function over(e)
  {
    self.moving = true;
    var n = WA.browser.getCursorNode(e);
    var x = WA.browser.getCursorInnerX(e) + ((n != self.domNode)?WA.browser.getNodeNodeLeft(n, self.domNode):0);
    var y = WA.browser.getCursorInnerY(e) + ((n != self.domNode)?WA.browser.getNodeNodeTop(n, self.domNode):0);
    self.percx = (x - self.cx) / self.width;
    self.percy = (y - self.cy) / self.height;
  }

  function out(e)
  {
  }


  // ======================================================
  // render

  this.draw = draw;
  function draw()
  {
    self.calculatedpoints = self.ST.calculatePoints(self.points, self.points.length, false);
    var zheight = self.ST.higher - self.ST.deeper;

    self.width = WA.browser.getNodeWidth(self.domNode);
    self.height = WA.browser.getNodeHeight(self.domNode);
    self.cx = self.width / 2;
    self.cy = self.height / 2;
    for (var i in self.objects)
    {
      var factor = 0.66 + (self.calculatedpoints[i].z - self.ST.deeper) / zheight / 3;
      // size
      var size = self.objects[i].size * self.scenescale;
      if (self.rendersize)
      {
        // factor is 1 on half height on z
        size = size * (factor + 0.17);
      }
      self.objects[i].node.style.fontSize = size + 'px';
      // color
      var color = self.objects[i].color;
      if (self.rendercolor)
      {
        // calculate color to darker or lighter based on the color
        var r = self.objects[i].rgb.red;
        var g = self.objects[i].rgb.green;
        var b = self.objects[i].rgb.blue;
        thres = (r+g+b)/3;
        if (thres > 128) // base color is light, go to darker
        {
          r = Math.floor(r * factor);
          g = Math.floor(g * factor);
          b = Math.floor(b * factor);
        }
        else // base color is dark, go to half grey like fog
        {
          r = Math.floor(r + (128-r) * (1-factor));
          g = Math.floor(g + (128-g) * (1-factor));
          b = Math.floor(b + (128-b) * (1-factor));
        }
        color = 'rgb('+r+','+g+','+b+')';
      }
      self.objects[i].node.style.color = color;
      var width = WA.browser.getNodeWidth(self.objects[i].node);
      var height = WA.browser.getNodeHeight(self.objects[i].node);
      self.objects[i].node.style.top = Math.floor(self.cy + self.calculatedpoints[i].y - height/2) + 'px';
      self.objects[i].node.style.left = Math.floor(self.cx + self.calculatedpoints[i].x - width/2) + 'px';
      self.objects[i].node.style.zIndex = Math.floor(self.calculatedpoints[i].z)+10000;
    }
  }

  // ======================================================
  // control

  // animation
  this.startAnimation = startAnimation;
  function startAnimation(formulae)
  {
    if (formulae)
      self.formulae = formulae;
    if (self.running)
      return;

    // start timer
    self.starttime = new Date().getTime();
    self.running = true;
    self.suspended = false;
    frame();
  }

  this.suspendAnimation = suspendAnimation;
  function suspendAnimation()
  {
    // no timer ? it is not working so we do not suspend
    if (self.running && !self.suspended)
    {
      self.suspendedtime = new Date().getTime();
      self.suspended = true;
      clearTimeout(self.timer);
      self.timer = null;
    }
  }

  this.resumeAnimation = resumeAnimation;
  function resumeAnimation()
  {
    if (self.running && self.suspended)
    {
      var delta = new Date().getTime() - self.suspendedtime;
      self.starttime += delta;
      self.suspended = false;
      frame();
    }
  }

  this.stopAnimation = stopAnimation;
  function stopAnimation()
  {
    if (!self.running)
      return;
    if (self.timer)
    {
      clearTimeout(self.timer);
      self.timer = null;
    }
    self.running = false;
  }

  // mouse
  this.startOver = startOver;
  function startOver()
  {
    WA.Managers.event.on('mouseover', self.domNode, over, true);
    WA.Managers.event.on('mousemove', self.domNode, over, true);
    WA.Managers.event.on('mouseout', self.domNode, out, true);
  }

  this.stopOver = stopOver;
  function stopOver()
  {
    WA.Managers.event.off('mouseover', self.domNode, over, true);
    WA.Managers.event.off('mousemove', self.domNode, over, true);
    WA.Managers.event.off('mouseout', self.domNode, out, true);
  }

  this.startDrag = startDrag;
  function startDrag()
  {
    WA.Managers.dd.registerGroup(self.id, 'caller', false, null, ddlistener);
    WA.Managers.dd.registerObject(self.id, self.domNode, self.domNode);
  }

  this.stopDrag = stopDrag;
  function stopDrag()
  {
    WA.Managers.dd.unregisterObject();
    WA.Managers.dd.unregisterGroup();
  }

  // ======================================================
  // parameters

  this.setTranslation = setTranslation;
  function setTranslation(t, pt)
  {
    self.ST.setTranslation(t, pt);
  }

  this.setRetroProyection = setRetroProyection;
  function setRetroProyection(eye, plan)
  {
    self.ST.setRetroProjection(eye, plan);
  }

  this.setScale = setScale;
  function setScale(sc)
  {
    self.scenescale = sc;
    self.ST.setMatrix(self.scenealpha, self.scenebeta, self.scenegamma, self.scenescale);
  }

  this.setRotation = setRotation;
  function setRotation(alpha, beta, gamma)
  {
    self.scenealpha = alpha;
    self.scenebeta = beta;
    self.scenegamma = gamma;
    self.ST.setMatrix(self.scenealpha, self.scenebeta, self.scenegamma, self.scenescale);
  }

  // ======================================================
  // tools

  // coords: {x:, y: z: } or undef/null
  // title: string or undef/null
  // color: string or undef/null
  this.modifyObject = modifyObject;
  function modifyObject(id, coords, title, color)
  {
    if (!self.objects[id])
      return;
    if (coords)
    {
      self.objects[id].x = coords.x;
      self.objects[id].y = coords.y;
      self.objects[id].z = coords.z;
      self.points[id] = coords;
    }
    if (title)
    {
      self.objects[id].title = title;
      self.objects[id].node.innerHTML = title;
    }
    if (color)
      self.objects[id].color = color;
  }

  this.addObject = addObject;
  function addObject(id, object)
  {
    if (!self.objects[id])
    {
      if (!object.node)
      {
        var node = document.createElement('div');
        node.style.position = 'absolute';
        node.style.top = '0px';
        node.style.left = '0px';
        self.domNode.appendChild(node);
        object.node = node;
        object.rgb = new RGB(object.color);
      }
      self.objects[id] = object;
    }
    self.objects[id].node.innerHTML = object.title;
    self.points[id] = {x: object.x, y: object.y, z: object.z};
  }

  this.removeObject = removeObject;
  function removeObject(id)
  {
    if (self.objects[id])
    {
      self.domNode.removeChild(self.objects[id].node);
      self.objects[id].node = null;
      delete self.objects[id];
    }
  }

}

