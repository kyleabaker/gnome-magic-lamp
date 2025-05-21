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
import { MagicLampMinimizeEffect } from './src/effects/magic-lamp-minimize.js';
import { MagicLampUnminimizeEffect } from './src/effects/magic-lamp-unminimize.js';

const MINIMIZE_EFFECT_NAME = 'minimize-magic-lamp-effect';
const UNMINIMIZE_EFFECT_NAME = 'unminimize-magic-lamp-effect';

export default class GnomeMagicLampExtension extends Extension {
  enable() {
    this.settingsData = createSettingsData(this.getSettings());

    // https://github.com/GNOME/gnome-shell/blob/master/js/ui/windowManager.js

    Main.wm.original_minimizeMaximizeWindow_shouldAnimateActor =
      Main.wm._shouldAnimateActor;
    Main.wm._shouldAnimateActor = function (actor, types) {
      let stack = new Error().stack;
      if (
        stack &&
        (stack.indexOf('_minimizeWindow') !== -1 ||
          stack.indexOf('_unminimizeWindow') !== -1)
      ) {
        return false;
      }

      return Main.wm.original_minimizeMaximizeWindow_shouldAnimateActor(
        actor,
        types
      );
    };

    Main.wm._shellwm.original_completed_minimize =
      Main.wm._shellwm.completed_minimize;
    Main.wm._shellwm.completed_minimize = function (actor) {
      return;
    };

    Main.wm._shellwm.original_completed_unminimize =
      Main.wm._shellwm.completed_unminimize;
    Main.wm._shellwm.completed_unminimize = function (actor) {
      return;
    };

    this.minimizeId = global.window_manager.connect('minimize', (e, actor) => {
      if (Main.overview.visible) {
        Main.wm._shellwm.original_completed_minimize(actor);
        return;
      }

      let icon = this.getIcon(actor);

      this.destroyActorEffect(actor);

      actor.add_effect_with_name(
        MINIMIZE_EFFECT_NAME,
        new MagicLampMinimizeEffect({
          settingsData: this.settingsData,
          icon: icon,
        })
      );
    });

    this.unminimizeId = global.window_manager.connect(
      'unminimize',
      (e, actor) => {
        actor.show();

        if (Main.overview.visible) {
          Main.wm._shellwm.original_completed_unminimize(actor);
          return;
        }

        let icon = this.getIcon(actor);

        this.destroyActorEffect(actor);

        actor.add_effect_with_name(
          UNMINIMIZE_EFFECT_NAME,
          new MagicLampUnminimizeEffect({
            settingsData: this.settingsData,
            icon: icon,
          })
        );
      }
    );
  }

  disable() {
    if (this.settingsData) {
      this.settingsData = null;
    }
    if (this.minimizeId) {
      global.window_manager.disconnect(this.minimizeId);
    }
    if (this.minimizeId) {
      global.window_manager.disconnect(this.unminimizeId);
    }

    global.get_window_actors().forEach((actor) => {
      this.destroyActorEffect(actor);
    });

    if (Main.wm.original_minimizeMaximizeWindow_shouldAnimateActor) {
      Main.wm._shouldAnimateActor =
        Main.wm.original_minimizeMaximizeWindow_shouldAnimateActor;
      Main.wm.original_minimizeMaximizeWindow_shouldAnimateActor = null;
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

  getIcon(actor) {
    let [success, icon] = actor.meta_window.get_icon_geometry();
    if (success) {
      return icon;
    }

    let monitor = Main.layoutManager.monitors[actor.meta_window.get_monitor()];
    if (monitor && Main.overview.dash) {
      Main.overview.dash._redisplay();

      let dashIcon = null;
      let transformed_position = null;
      let pids = null;
      let pid = actor.get_meta_window()
        ? actor.get_meta_window().get_pid()
        : null;
      if (pid) {
        Main.overview.dash._box
          .get_children()
          .filter((dashElement) => dashElement?.child?._delegate?.app)
          .forEach((dashElement) => {
            pids = dashElement.child._delegate.app.get_pids();
            if (pids && pids.indexOf(pid) >= 0) {
              transformed_position = dashElement.get_transformed_position();
              if (transformed_position && transformed_position[0]) {
                dashIcon = {
                  x: transformed_position[0],
                  y: monitor.y + monitor.height,
                  width: 0,
                  height: 0,
                };
                return;
              }
            }
          });
      }
      if (dashIcon) {
        return dashIcon;
      }

      return {
        x: monitor.x + monitor.width / 2,
        y: monitor.y + monitor.height,
        width: 0,
        height: 0,
      };
    }

    return { x: 0, y: 0, width: 0, height: 0 };
  }

  destroyActorEffect(actor) {
    if (!actor) {
      return;
    }

    let minimizeEffect = actor.get_effect(MINIMIZE_EFFECT_NAME);
    if (minimizeEffect) {
      minimizeEffect.destroy();
    }

    let unminimizeEffect = actor.get_effect(UNMINIMIZE_EFFECT_NAME);
    if (unminimizeEffect) {
      unminimizeEffect.destroy();
    }
  }
}
