/*
 * GNOME Magic Lamp for GNOME Shell
 *
 * Copyright (C) 2020
 *     Mauro Pepe <https://github.com/hermes83/compiz-alike-magic-lamp-effect>
 * Copyright (C) 2025
 *     Kyle Baker <https://github.com/kyleabaker/gnome-wobbly-windows>
 *
 * This file is part of the gnome-shell extension gnome-magic-lamp.
 *
 * gnome-shell extension gnome-magic-lamp is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * gnome-shell extension gnome-magic-lamp is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell extension gnome-magic-lamp.  If not, see
 * <http://www.gnu.org/licenses/>.
 */
'use strict';

import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { AbstractCommonMagicLampEffect } from '../abstract/common-magic-lamp.js';

export class MagicLampUnminimizeEffect extends AbstractCommonMagicLampEffect {
  static {
    GObject.registerClass(this);
  }

  _init(params = {}) {
    super._init(params);

    this.k = 1;
    this.j = 1;
    this.isMinimizeEffect = false;
  }

  destroy_actor(actor) {
    Main.wm._shellwm.original_completed_unminimize(actor);
  }

  on_tick_elapsed(timer, msecs) {
    if (Main.overview.visible) {
      this.destroy();
    }

    this.progress = timer.get_progress();
    this.k =
      1 -
      (this.progress > 1 - this.split
        ? (this.progress - (1 - this.split)) * (1 / 1 / (1 - (1 - this.split)))
        : 0);
    this.j =
      1 -
      (this.progress <= 1 - this.split
        ? this.progress * (1 / 1 / (1 - this.split))
        : 1);

    this.actor.get_parent().queue_redraw();
    this.invalidate();
  }

  vfunc_modify_paint_volume(pv) {
    return false;
  }
}
