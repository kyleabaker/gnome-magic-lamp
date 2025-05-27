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

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { createSettingsData } from './src/settings/data.js';

import { MagicLampMinimizeEffect } from './src/effects/minimize.js';
import { MagicLampUnminimizeEffect } from './src/effects/unminimize.js';

const MINIMIZE_EFFECT_NAME = 'minimize-magic-lamp-effect';
const UNMINIMIZE_EFFECT_NAME = 'unminimize-magic-lamp-effect';

/**
 * https://github.com/GNOME/gnome-shell/blob/master/js/ui/windowManager.js
 */
export default class GnomeMagicLampExtension extends Extension {
  enable() {
    this.settingsData = createSettingsData(this.getSettings());

    this._patchWindowManager();
    this._connectWindowSignals();
  }

  disable() {
    this._disconnectWindowSignals();
    this._restoreWindowManager();
    this.settingsData = null;

    global.get_window_actors().forEach((actor) => this._removeEffects(actor));
  }

  _patchWindowManager() {
    Main.wm.original_shouldAnimateActor = Main.wm._shouldAnimateActor;
    Main.wm._shouldAnimateActor = (actor, types) => {
      const stack = new Error().stack;
      if (
        stack?.includes('_minimizeWindow') ||
        stack?.includes('_unminimizeWindow')
      ) {
        return false;
      }
      return Main.wm.original_shouldAnimateActor(actor, types);
    };

    Main.wm._shellwm.original_completed_minimize =
      Main.wm._shellwm.completed_minimize;
    Main.wm._shellwm.completed_minimize = () => {};

    Main.wm._shellwm.original_completed_unminimize =
      Main.wm._shellwm.completed_unminimize;
    Main.wm._shellwm.completed_unminimize = () => {};
  }

  _restoreWindowManager() {
    if (Main.wm.original_shouldAnimateActor) {
      Main.wm._shouldAnimateActor = Main.wm.original_shouldAnimateActor;
      Main.wm.original_shouldAnimateActor = null;
    }

    if (Main.wm._shellwm.original_completed_minimize) {
      Main.wm._shellwm.completed_minimize =
        Main.wm._shellwm.original_completed_minimize;
      Main.wm._shellwm.original_completed_minimize = null;
    }

    if (Main.wm._shellwm.original_completed_unminimize) {
      Main.wm._shellwm.completed_unminimize =
        Main.wm._shellwm.original_completed_unminimize;
      Main.wm._shellwm.original_completed_unminimize = null;
    }
  }

  _connectWindowSignals() {
    this._minimizeId = global.window_manager.connect('minimize', (e, actor) => {
      if (Main.overview.visible) {
        Main.wm._shellwm.original_completed_minimize(actor);
        return;
      }

      this._removeEffects(actor);

      actor.add_effect_with_name(
        MINIMIZE_EFFECT_NAME,
        new MagicLampMinimizeEffect({
          settingsData: this.settingsData,
          getIcon: () => this._getIcon(actor),
        })
      );
    });

    this._unminimizeId = global.window_manager.connect(
      'unminimize',
      (e, actor) => {
        actor.show();

        if (Main.overview.visible) {
          Main.wm._shellwm.original_completed_unminimize(actor);
          return;
        }

        this._removeEffects(actor);

        actor.add_effect_with_name(
          UNMINIMIZE_EFFECT_NAME,
          new MagicLampUnminimizeEffect({
            settingsData: this.settingsData,
            getIcon: () => this._getIcon(actor),
          })
        );
      }
    );
  }

  _disconnectWindowSignals() {
    if (this._minimizeId) {
      global.window_manager.disconnect(this._minimizeId);
      this._minimizeId = null;
    }

    if (this._unminimizeId) {
      global.window_manager.disconnect(this._unminimizeId);
      this._unminimizeId = null;
    }
  }

  _getIcon(actor) {
    const [hasIcon, icon] = actor.meta_window.get_icon_geometry();
    if (hasIcon) return icon;

    const monitor =
      Main.layoutManager.monitors[actor.meta_window.get_monitor()];
    if (!monitor) return { x: 0, y: 0, width: 0, height: 0 };

    const dashIcon = this._findDashIconForActor(actor, monitor);
    if (dashIcon) return dashIcon;

    return {
      x: monitor.x + monitor.width / 2,
      y: monitor.y + monitor.height,
      width: 0,
      height: 0,
    };
  }

  _findDashIconForActor(actor, monitor) {
    const pid = actor.meta_window?.get_pid();
    if (!pid || !Main.overview.dash) return null;

    Main.overview.dash._redisplay();

    const dashChildren = Main.overview.dash._box.get_children() || [];
    for (const dashElement of dashChildren) {
      if (dashElement?.child?._delegate?.app?.get_pids?.()?.includes(pid)) {
        const [x] = dashElement.get_transformed_position() || [0];

        return {
          x,
          y: monitor.y + monitor.height,
          width: 0,
          height: 0,
        };
      }
    }

    return null;
  }

  _removeEffects(actor) {
    if (!actor) return;

    const minimizeEffect = actor.get_effect(MINIMIZE_EFFECT_NAME);
    if (minimizeEffect) minimizeEffect.destroy();

    const unminimizeEffect = actor.get_effect(UNMINIMIZE_EFFECT_NAME);
    if (unminimizeEffect) unminimizeEffect.destroy();
  }
}
