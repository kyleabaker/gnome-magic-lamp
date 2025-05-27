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

import { AbstractCommonMagicLampEffect } from '../abstract/common.js';
import { easeOutCubic } from '../utils/common.js';

/**
 * MagicLampMinimizeEffect
 * Handles the deformation effect when minimizing a window.
 */
export class MagicLampMinimizeEffect extends AbstractCommonMagicLampEffect {
  static {
    GObject.registerClass(this);
  }

  /**
   * Initializes the minimize effect.
   * @param {Object} [params={}] - Optional parameters.
   */
  _init(params = {}) {
    super._init(params);

    this.k = 0;
    this.j = 0;
    this.isMinimizeEffect = true;

    this.lastRedraw = 0;
    this.MIN_FRAME_INTERVAL = 8; // ~120fps
  }

  /**
   * Called when the effect animation completes.
   * Restores original GNOME Shell behavior for minimize.
   * @param {Clutter.Actor} actor - The affected actor.
   */
  destroy_actor(actor) {
    if (Main.wm?._shellwm?.original_completed_minimize) {
      Main.wm._shellwm.original_completed_minimize(actor);
    }
  }

  /**
   * Called on each frame of the animation timeline.
   * Updates the deformation parameters and triggers redraw.
   * @param {Clutter.Timeline} timer - Timeline instance.
   * @param {number} msecs - Milliseconds elapsed.
   */
  // eslint-disable-next-line no-unused-vars
  on_tick_elapsed(timer, _msecs) {
    if (Main.overview.visible) {
      this.destroy();
      return;
    }

    this.progress = timer.get_progress();

    this.k =
      this.progress <= this.split
        ? easeOutCubic(this.progress / this.split, this.EASE_OUT)
        : 1;

    this.j =
      this.progress > this.split
        ? easeOutCubic(
            (this.progress - this.split) / (1 - this.split),
            this.EASE_OUT
          )
        : 0;

    const now = Date.now();
    if (now - this.lastRedraw >= this.MIN_FRAME_INTERVAL) {
      this.actor?.get_parent?.()?.queue_redraw?.();
      this.lastRedraw = now;
    }
    this.invalidate();
  }

  /**
   * Disables default paint volume modification to avoid culling issues.
   * @param {Clutter.PaintVolume} pv - Paint volume.
   * @returns {boolean} Always returns false.
   */
  // eslint-disable-next-line no-unused-vars
  vfunc_modify_paint_volume(_pv) {
    return false;
  }
}
