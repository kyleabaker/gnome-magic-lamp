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
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

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
    this.icon = params.icon || this._createRect();

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
    this.toTheBorder = true; // true
    this.maxIconSize = null; // 48

    this.EPSILON = 40;

    this.EFFECT = this.settingsData?.EFFECT?.get?.() || 'default'; //'default' - 'sine'
    this.DURATION = this.settingsData?.DURATION?.get?.() || 400;
    this.EASE_OUT = !!this.settingsData?.EASE_OUT?.get?.();
    this.X_TILES = this.settingsData?.X_TILES?.get?.() || 20;
    this.Y_TILES = this.settingsData?.Y_TILES?.get?.() || 20;

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

  destroy_actor(actor) {} // NOSONAR
  on_tick_elapsed(timer, msecs) {} // NOSONAR

  vfunc_deform_vertex(w, h, v) {
    if (!this.initialized) return;

    const propX = w / this.window.width;
    const propY = h / this.window.height;

    const { x, y } = this._deformBySide(v);
    v.x = x * propX;
    v.y = y * propY;
  }

  _deformBySide(v) {
    switch (this.iconPosition) {
      case St.Side.LEFT:
        return this._deformLeft(v);
      case St.Side.TOP:
        return this._deformTop(v);
      case St.Side.RIGHT:
        return this._deformRight(v);
      case St.Side.BOTTOM:
        return this._deformBottom(v);
      default:
        return { x: 0, y: 0 };
    }
  }

  _deformLeft(v) {
    const width = this.window.width - this.icon.width + this.window.x * this.k;
    const x = (width - this.j * width) * v.tx;
    const y =
      (v.ty * this.window.height * (x + (width - x) * (1 - this.k))) / width +
      (v.ty * this.icon.height * (width - x)) / width;

    const offsetX = this.icon.width - this.window.x * this.k;
    const offsetY =
      (this.icon.y - this.window.y) * ((width - x) / width) * this.k;
    const effectY =
      this.EFFECT === 'sine'
        ? ((Math.sin((x / width) * Math.PI * 4) * this.window.height) / 14) *
          this.k
        : ((Math.sin((0.5 - (width - x) / width) * 2 * Math.PI) *
            (this.window.y +
              this.window.height * v.ty -
              (this.icon.y + this.icon.height * v.ty))) /
            7) *
          this.k;

    return { x: x + offsetX, y: y + offsetY + effectY };
  }

  _deformTop(v) {
    const height =
      this.window.height - this.icon.height + this.window.y * this.k;
    const y = (height - this.j * height) * v.ty;
    const x =
      (v.tx * this.window.width * (y + (height - y) * (1 - this.k))) / height +
      (v.tx * this.icon.width * (height - y)) / height;

    const offsetX =
      (this.icon.x - this.window.x) * ((height - y) / height) * this.k;
    const offsetY = this.icon.height - this.window.y * this.k;
    const effectX =
      this.EFFECT === 'sine'
        ? ((Math.sin((y / height) * Math.PI * 4) * this.window.width) / 14) *
          this.k
        : ((Math.sin((0.5 - (height - y) / height) * 2 * Math.PI) *
            (this.window.x +
              this.window.width * v.tx -
              (this.icon.x + this.icon.width * v.tx))) /
            7) *
          this.k;

    return { x: x + offsetX + effectX, y: y + offsetY };
  }

  _deformRight(v) {
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

    const x = v.tx * width;
    const y =
      v.ty * this.icon.height +
      v.ty *
        (this.window.height - this.icon.height) *
        (1 - this.j) *
        (1 - v.tx) +
      v.ty * (this.window.height - this.icon.height) * (1 - this.k) * v.tx;

    const offsetX =
      this.iconMonitor.width -
      this.icon.width -
      this.window.x -
      width -
      expandWidth * (1 - this.k);
    const offsetY =
      (this.icon.y - this.window.y) * (x / fullWidth) * this.k +
      (this.icon.y - this.window.y) * this.j;
    const effectY =
      this.EFFECT === 'sine'
        ? ((Math.sin(((width - x) / fullWidth) * Math.PI * 4) *
            this.window.height) /
            14) *
          this.k
        : ((Math.sin(((width - x) / fullWidth) * 2 * Math.PI + Math.PI) *
            (this.window.y +
              this.window.height * v.ty -
              (this.icon.y + this.icon.height * v.ty))) /
            7) *
          this.k;

    return { x: x + offsetX, y: y + offsetY + effectY };
  }

  _deformBottom(v) {
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

    const y = v.ty * height;
    const x =
      v.tx * this.icon.width +
      v.tx * (this.window.width - this.icon.width) * (1 - this.j) * (1 - v.ty) +
      v.tx * (this.window.width - this.icon.width) * (1 - this.k) * v.ty;

    const offsetX =
      (this.icon.x - this.window.x) * (y / fullHeight) * this.k +
      (this.icon.x - this.window.x) * this.j;
    const offsetY =
      this.iconMonitor.height -
      this.icon.height -
      this.window.y -
      height -
      expandHeight * (1 - this.k);
    const effectX =
      this.EFFECT === 'sine'
        ? ((Math.sin(((height - y) / fullHeight) * Math.PI * 4) *
            this.window.width) /
            14) *
          this.k
        : ((Math.sin(((height - y) / fullHeight) * 2 * Math.PI + Math.PI) *
            (this.window.x +
              this.window.width * v.tx -
              (this.icon.x + this.icon.width * v.tx))) /
            7) *
          this.k;

    return { x: x + offsetX + effectX, y: y + offsetY };
  }
}
