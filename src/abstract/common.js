/*
 * GNOME Magic Lamp for GNOME Shell
 *
 * Copyright (C) 2020
 *     Mauro Pepe <https://github.com/hermes83/compiz-alike-magic-lamp-effect>
 * Copyright (C) 2025
 *     Kyle Baker <https://github.com/kyleabaker/gnome-magic-lamp>
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
import Clutter from 'gi://Clutter';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { logger } from '../utils/logger.js';

const PI2 = 2 * Math.PI;
const PI4 = 4 * Math.PI;

/**
 * AbstractCommonMagicLampEffect
 * Abstract base class for implementing a Magic Lamp animation effect.
 */
export class AbstractCommonMagicLampEffect extends Clutter.DeformEffect {
  static {
    GObject.registerClass(this);
  }

  _init(params = {}) {
    super._init();

    this.settingsData = params.settingsData;
    this.getIcon = params.getIcon;
    if (typeof this.getIcon === 'function') {
      this.icon = this.getIcon() || this._createRect();
    } else {
      this.icon = this._createRect();
    }

    this.monitor = this._createRect();
    this.iconMonitor = this._createRect();
    this.window = { ...this._createRect(), scale: 1 };
    this.isMinimizeEffect = false;
    this.progress = 0;
    this.k = 0;
    this.j = 0;
    this.split = 0.3;
    this.newFrameEvent = null;
    this.completedEvent = null;
    this.timerId = null;
    this.iconPosition = null;
    this.toTheBorder = true;

    this.EPSILON = 40;

    this.EFFECT = this.settingsData?.EFFECT?.get?.() || 'default'; //'default' - 'sine'
    this.isSine = this.EFFECT === 'sine';
    this._deformSide = null;
    this._lastW = 0;
    this._lastH = 0;
    this._propX = 1;
    this._propY = 1;
    this.DURATION = this.settingsData?.DURATION?.get?.() || 400;
    this.EASE_OUT = !!this.settingsData?.EASE_OUT?.get?.() || false;
    this.X_TILES = this.settingsData?.X_TILES?.get?.() || 20;
    this.Y_TILES = this.settingsData?.Y_TILES?.get?.() || 20;
    this.ENABLE_LOGGING = this.settingsData?.ENABLE_LOGGING?.get?.() || false;

    this.initialized = false;
  }

  _createRect() {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  vfunc_set_actor(actor) {
    super.vfunc_set_actor(actor);

    if (!actor || this.initialized) return;

    this.initialized = true;
    const monitorIndex = actor.meta_window.get_monitor();
    this.monitor = Main.layoutManager.monitors[monitorIndex];

    [this.window.x, this.window.y] = [
      actor.get_x() - this.monitor.x,
      actor.get_y() - this.monitor.y,
    ];
    [this.window.width, this.window.height] = actor.get_size();

    this._initializeIconPosition();
    this.set_n_tiles(this.X_TILES, this.Y_TILES);
    this.updateFrameState();

    // Scale factor helps avoid crazy-fast durations for small windows and slow for big ones for a more consistent perception.
    const scaleFactor = Math.max(
      0.75,
      Math.min(
        1.5,
        (this.window.width * this.window.height) /
          (this.monitor.width * this.monitor.height)
      )
    );
    const duration = this.DURATION * scaleFactor;

    this.timerId = new Clutter.Timeline({
      actor,
      duration,
    });
    this.newFrameEvent = this.timerId.connect(
      'new-frame',
      this.on_tick_elapsed.bind(this)
    );
    this.completedEvent = this.timerId.connect(
      'completed',
      this.destroy.bind(this)
    );
    this.timerId.start();

    logger.log(this.ENABLE_LOGGING, 'Extension initialized.');
  }

  _initializeIconPosition() {
    if (this.icon.width === 0 && this.icon.height === 0) {
      this.icon.x = this.monitor.x + this.monitor.width / 2;
      this.icon.y = this.monitor.y + this.monitor.height;
    }

    for (let [i, monitor] of Main.layoutManager.monitors.entries()) {
      const scale = global.display?.get_monitor_scale?.(i) || 1;
      if (
        this.icon.x >= monitor.x &&
        this.icon.x <= monitor.x + monitor.width * scale &&
        this.icon.y >= monitor.y &&
        this.icon.y <= monitor.y + monitor.height * scale
      ) {
        this.iconMonitor = monitor;
        break;
      }
    }

    if (this.iconMonitor.width === 0 && this.iconMonitor.height === 0) {
      this.iconMonitor = this.monitor;
    }

    [this.icon.x, this.icon.y] = [
      this.icon.x - this.monitor.x,
      this.icon.y - this.monitor.y,
    ];

    this._determineIconSide();
  }

  _determineIconSide() {
    const { width, height } = this.monitor;

    if (this.icon.y + this.icon.height >= height - this.EPSILON) {
      this.iconPosition = St.Side.BOTTOM;
      if (this.toTheBorder) {
        this.icon.y =
          this.iconMonitor.y + this.iconMonitor.height - this.monitor.y;
        this.icon.height = 0;
      }
    } else if (this.icon.x <= this.EPSILON) {
      this.iconPosition = St.Side.LEFT;
      if (this.toTheBorder) {
        this.icon.x = this.iconMonitor.x - this.monitor.x;
        this.icon.width = 0;
      }
    } else if (this.icon.x + this.icon.width >= width - this.EPSILON) {
      this.iconPosition = St.Side.RIGHT;
      if (this.toTheBorder) {
        this.icon.x =
          this.iconMonitor.x + this.iconMonitor.width - this.monitor.x;
        this.icon.width = 0;
      }
    } else {
      this.iconPosition = St.Side.TOP;
      if (this.toTheBorder) {
        this.icon.y = this.iconMonitor.y - this.monitor.y;
        this.icon.height = 0;
      }
    }

    // Auto RTL fallback override (when icon is ambiguous and dock is on right in RTL)
    if (
      this.iconPosition === St.Side.TOP &&
      global.display?.get_current_layout_direction?.() ===
        Clutter.TextDirection.RTL &&
      this.icon.x > this.monitor.width / 2 // Heuristic: icon is on the right side
    ) {
      this.iconPosition = St.Side.RIGHT;
    }

    switch (this.iconPosition) {
      case St.Side.LEFT:
        this._deformSide = this._deformLeft;
        break;
      case St.Side.TOP:
        this._deformSide = this._deformTop;
        break;
      case St.Side.RIGHT:
        this._deformSide = this._deformRight;
        break;
      case St.Side.BOTTOM:
        this._deformSide = this._deformBottom;
        break;
      default:
        this._deformSide = null;
        break;
    }
  }

  destroy() {
    if (this.timerId) {
      if (this.newFrameEvent) {
        this.timerId.disconnect(this.newFrameEvent);
        this.newFrameEvent = null;
      }
      if (this.completedEvent) {
        this.timerId.disconnect(this.completedEvent);
        this.completedEvent = null;
      }
      this.timerId = null;
    }

    const actor = this.get_actor();
    if (actor) {
      if (this.paintEvent) {
        actor.disconnect(this.paintEvent);
        this.paintEvent = null;
      }
      actor.remove_effect(this);
      this.destroy_actor(actor);
    }
  }

  // eslint-disable-next-line no-unused-vars
  destroy_actor(_actor) {} // NOSONAR
  // eslint-disable-next-line no-unused-vars
  on_tick_elapsed(_timer, _msecs) {} // NOSONAR

  vfunc_deform_vertex(w, h, v) {
    if (!this.initialized || !this._deformSide) return;

    if (this._lastW !== w || this._lastH !== h) {
      this._lastW = w;
      this._lastH = h;
      this._propX = this.window.width !== 0 ? w / this.window.width : 1;
      this._propY = this.window.height !== 0 ? h / this.window.height : 1;
    }

    this._deformSide(v, this._propX, this._propY);
  }

  updateFrameState() {
    if (!this.initialized) return;

    switch (this.iconPosition) {
      case St.Side.LEFT: {
        const width =
          this.window.width - this.icon.width + this.window.x * this.k;
        this._f_width = width;
        this._f_invWidth = width !== 0 ? 1 / width : 0;
        this._f_spanX = (1 - this.j) * width;
        this._f_offsetX = this.icon.width - this.window.x * this.k;
        this._f_diffY_k = (this.icon.y - this.window.y) * this.k;
        this._f_oneMinusK = 1 - this.k;
        this._f_sineCoeff = this.isSine
          ? (this.window.height / 14) * this.k
          : 0;
        this._f_coeffK_7 = !this.isSine ? this.k / 7 : 0;
        this._f_baseY = this.window.y - this.icon.y;
        this._f_heightDiff = this.window.height - this.icon.height;
        break;
      }
      case St.Side.TOP: {
        const height =
          this.window.height - this.icon.height + this.window.y * this.k;
        this._f_height = height;
        this._f_invHeight = height !== 0 ? 1 / height : 0;
        this._f_spanY = (1 - this.j) * height;
        this._f_offsetY = this.icon.height - this.window.y * this.k;
        this._f_diffX_k = (this.icon.x - this.window.x) * this.k;
        this._f_oneMinusK = 1 - this.k;
        this._f_sineCoeff = this.isSine ? (this.window.width / 14) * this.k : 0;
        this._f_coeffK_7 = !this.isSine ? this.k / 7 : 0;
        this._f_baseX = this.window.x - this.icon.x;
        this._f_widthDiff = this.window.width - this.icon.width;
        break;
      }
      case St.Side.RIGHT: {
        const expandWidth =
          this.iconMonitor.width -
          this.icon.width -
          this.window.x -
          this.window.width;
        const fullWidth =
          this.iconMonitor.width -
          this.icon.width -
          this.window.x -
          expandWidth * (1 - this.k);
        const width = fullWidth - this.j * fullWidth;
        this._f_fullWidth = fullWidth;
        this._f_invFullWidth = fullWidth !== 0 ? 1 / fullWidth : 0;
        this._f_width = width;
        this._f_offsetX =
          this.iconMonitor.width -
          this.icon.width -
          this.window.x -
          width -
          expandWidth * (1 - this.k);
        const diffY = this.icon.y - this.window.y;
        this._f_offsetYBase = diffY * this.j;
        this._f_offsetYScale = diffY * this.k * this._f_invFullWidth;
        const heightDiff = this.window.height - this.icon.height;
        this._f_heightDiff = heightDiff;
        this._f_coeff1 = heightDiff * (1 - this.j);
        this._f_coeff2 = heightDiff * (1 - this.k);
        this._f_sineCoeff = this.isSine
          ? (this.window.height / 14) * this.k
          : 0;
        this._f_coeffK_7 = !this.isSine ? this.k / 7 : 0;
        this._f_baseY = this.window.y - this.icon.y;
        break;
      }
      case St.Side.BOTTOM: {
        const expandHeight =
          this.iconMonitor.height -
          this.icon.height -
          this.window.y -
          this.window.height;
        const fullHeight =
          this.iconMonitor.height -
          this.icon.height -
          this.window.y -
          expandHeight * (1 - this.k);
        const height = fullHeight - this.j * fullHeight;
        this._f_fullHeight = fullHeight;
        this._f_invFullHeight = fullHeight !== 0 ? 1 / fullHeight : 0;
        this._f_height = height;
        this._f_offsetY =
          this.iconMonitor.height -
          this.icon.height -
          this.window.y -
          height -
          expandHeight * (1 - this.k);
        const diffX = this.icon.x - this.window.x;
        this._f_offsetXBase = diffX * this.j;
        this._f_offsetXScale = diffX * this.k * this._f_invFullHeight;
        const widthDiff = this.window.width - this.icon.width;
        this._f_widthDiff = widthDiff;
        this._f_coeff1 = widthDiff * (1 - this.j);
        this._f_coeff2 = widthDiff * (1 - this.k);
        this._f_sineCoeff = this.isSine ? (this.window.width / 14) * this.k : 0;
        this._f_coeffK_7 = !this.isSine ? this.k / 7 : 0;
        this._f_baseX = this.window.x - this.icon.x;
        break;
      }
    }
  }

  _deformLeft(v, propX, propY) {
    const x = this._f_spanX * v.tx;
    const normX = x * this._f_invWidth;
    const ratio = 1 - normX;
    const y =
      v.ty *
      (this.window.height * (normX + ratio * this._f_oneMinusK) +
        this.icon.height * ratio);
    const offsetY = this._f_diffY_k * ratio;

    let effectY;
    if (this.isSine) {
      effectY = Math.sin(normX * PI4) * this._f_sineCoeff;
    } else {
      const sineFactor = Math.sin((0.5 - ratio) * PI2);
      effectY =
        sineFactor *
        (this._f_baseY + this._f_heightDiff * v.ty) *
        this._f_coeffK_7;
    }

    v.x = (x + this._f_offsetX) * propX;
    v.y = (y + offsetY + effectY) * propY;
  }

  _deformTop(v, propX, propY) {
    const y = this._f_spanY * v.ty;
    const normY = y * this._f_invHeight;
    const ratio = 1 - normY;
    const x =
      v.tx *
      (this.window.width * (normY + ratio * this._f_oneMinusK) +
        this.icon.width * ratio);
    const offsetX = this._f_diffX_k * ratio;

    let effectX;
    if (this.isSine) {
      effectX = Math.sin(normY * PI4) * this._f_sineCoeff;
    } else {
      const sineFactor = Math.sin((0.5 - ratio) * PI2);
      effectX =
        sineFactor *
        (this._f_baseX + this._f_widthDiff * v.tx) *
        this._f_coeffK_7;
    }

    v.x = (x + offsetX + effectX) * propX;
    v.y = (y + this._f_offsetY) * propY;
  }

  _deformRight(v, propX, propY) {
    const x = v.tx * this._f_width;
    const y =
      v.ty *
      (this.icon.height + this._f_coeff1 * (1 - v.tx) + this._f_coeff2 * v.tx);
    const offsetY = x * this._f_offsetYScale + this._f_offsetYBase;
    const ratio = (this._f_width - x) * this._f_invFullWidth;

    let effectY;
    if (this.isSine) {
      effectY = Math.sin(ratio * PI4) * this._f_sineCoeff;
    } else {
      const sineFactor = Math.sin(ratio * PI2 + Math.PI);
      effectY =
        sineFactor *
        (this._f_baseY + this._f_heightDiff * v.ty) *
        this._f_coeffK_7;
    }

    v.x = (x + this._f_offsetX) * propX;
    v.y = (y + offsetY + effectY) * propY;
  }

  _deformBottom(v, propX, propY) {
    const y = v.ty * this._f_height;
    const x =
      v.tx *
      (this.icon.width + this._f_coeff1 * (1 - v.ty) + this._f_coeff2 * v.ty);
    const offsetX = y * this._f_offsetXScale + this._f_offsetXBase;
    const ratio = (this._f_height - y) * this._f_invFullHeight;

    let effectX;
    if (this.isSine) {
      effectX = Math.sin(ratio * PI4) * this._f_sineCoeff;
    } else {
      const sineFactor = Math.sin(ratio * PI2 + Math.PI);
      effectX =
        sineFactor *
        (this._f_baseX + this._f_widthDiff * v.tx) *
        this._f_coeffK_7;
    }

    v.x = (x + offsetX + effectX) * propX;
    v.y = (y + this._f_offsetY) * propY;
  }
}
