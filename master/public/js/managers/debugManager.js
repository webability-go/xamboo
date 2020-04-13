
/*
    debugManager.js, WAJAF, the WebAbility(r) Javascript Application Framework
    Contains the Manager singleton to manage deep and complete 4GL debug window
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

// The debug Manager will shortcut the WA.debug and takes control of all possible known listeners and nodes

WA.Managers.debug = new function()
{
  var self = this;

  function destroy()
  {
    self = null;
  }

  WA.Managers.event.registerFlush(destroy);
}();

