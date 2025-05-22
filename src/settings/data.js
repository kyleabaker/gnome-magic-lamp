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

/**
 * Create the settings data object for the extension preferences window
 *
 * @param {*} settings
 * @returns settings data object
 */
export function createSettingsData(settings) {
  const stringKeys = [['EFFECT', 'effect']];

  const doubleKeys = [
    ['DURATION', 'duration'],
    ['X_TILES', 'x-tiles'],
    ['Y_TILES', 'y-tiles'],
  ];

  const booleanKeys = [['EASE_OUT', 'ease-out']];

  const data = {};

  for (const [prop, key] of stringKeys) {
    data[prop] = {
      get: () => settings.get_string(key),
      set: (v) => settings.set_string(key, v),
    };
  }

  for (const [prop, key] of doubleKeys) {
    data[prop] = {
      get: () => settings.get_double(key),
      set: (v) => settings.set_double(key, v),
    };
  }

  for (const [prop, key] of booleanKeys) {
    data[prop] = {
      get: () => settings.get_boolean(key),
      set: (v) => settings.set_boolean(key, v),
    };
  }

  return data;
}
