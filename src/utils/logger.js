/*
 * GNOME Magic Lamp for GNOME Shell
 *
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

const PREFIX = '[GnomeMagicLamp]';

export const logger = {
  log: (isEnabled, message) => {
    if (!isEnabled) return;
    console.log(`${PREFIX} ${message}`);
  },

  debug: (isEnabled, message) => {
    if (!isEnabled) return;
    console.debug(`${PREFIX} ${message}`);
  },

  info: (isEnabled, message) => {
    if (!isEnabled) return;
    console.info(`${PREFIX} ${message}`);
  },

  warn: (isEnabled, message) => {
    if (!isEnabled) return;
    console.warn(`${PREFIX} ${message}`);
  },

  error: (isEnabled, message, exception = null) => {
    if (!isEnabled) return;
    console.error(`${PREFIX} ${message}:\n${exception}`);
  },
};
