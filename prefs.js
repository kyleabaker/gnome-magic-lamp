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

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { createSettingsData } from './src/settings/data.js';

/**
 * Preferences window for GNOME Magic Lamp
 */
export default class Prefs extends ExtensionPreferences {
  /**
   * Fill preferences window
   *
   * @param {Gtk.Window} window
   */
  fillPreferencesWindow(window) {
    const settingsData = createSettingsData(this.getSettings());

    const width = 750;
    const height = 500;
    window.set_default_size(width, height);

    const page = Adw.PreferencesPage.new();
    page.set_title('GNOME Magic Lamp');

    // Group 1: Animation type and duration
    const group1 = Adw.PreferencesGroup.new();
    group1.set_title('Animation');
    this.effectComboBox = this.addComboBox(
      group1,
      'Effect',
      settingsData.EFFECT,
      ['default', 'sine']
    );
    this.durationSlider = this.addSlider(
      group1,
      'Duration (ms)',
      settingsData.DURATION,
      100,
      1000,
      0
    );
    this.easeOutSwitch = this.addBooleanSwitch(
      group1,
      'Ease Out',
      settingsData.EASE_OUT
    );
    page.add(group1);

    // Group 2: Tile grid
    const group2 = Adw.PreferencesGroup.new();
    group2.set_title('Tile Resolution');
    this.xTilesSlider = this.addSlider(
      group2,
      'X Tiles',
      settingsData.X_TILES,
      3,
      50,
      0
    );
    this.yTilesSlider = this.addSlider(
      group2,
      'Y Tiles',
      settingsData.Y_TILES,
      3,
      50,
      0
    );
    page.add(group2);

    // Settings group 3: Enable Logging
    const group3 = Adw.PreferencesGroup.new();
    this.enableLoggingSwitch = this.addBooleanSwitch(
      group3,
      'Enable Logging',
      settingsData.ENABLE_LOGGING
    );
    page.add(group3);

    // Reset button
    this.addResetButton(window, settingsData);

    window.add(page);
  }

  /**
   * Add reset button
   *
   * @param {Gtk.Window} window
   * @param {Object} settingsData
   */
  addResetButton(window, settingsData) {
    const button = new Gtk.Button({ vexpand: true, valign: Gtk.Align.END });
    button.set_icon_name('edit-clear');

    button.connect('clicked', () => {
      settingsData.EFFECT.set('default');
      settingsData.DURATION.set(400);
      settingsData.EASE_OUT.set(false);
      settingsData.X_TILES.set(20);
      settingsData.Y_TILES.set(20);
      settingsData.ENABLE_LOGGING.set(false);

      this.effectComboBox.set_active(settingsData.EFFECT.get());
      this.durationSlider.set_value(settingsData.DURATION.get());
      this.easeOutSwitch.set_value(settingsData.EASE_OUT.get());
      this.xTilesSlider.set_value(settingsData.X_TILES.get());
      this.yTilesSlider.set_value(settingsData.Y_TILES.get());
      this.enableLoggingSwitch.set_value(settingsData.ENABLE_LOGGING.get());
    });

    const header = this.findWidgetByType(window.get_content(), Adw.HeaderBar);
    if (header) header.pack_start(button);

    return button;
  }

  /**
   * Add slider
   *
   * @param {Adw.PreferencesGroup} group
   * @param {string} labelText
   * @param {Object} settingsData
   * @param {number} lower
   * @param {number} upper
   * @param {number} decimalDigits
   */
  addSlider(group, labelText, settingsData, lower, upper, decimalDigits) {
    const scale = new Gtk.Scale({
      digits: decimalDigits,
      adjustment: new Gtk.Adjustment({ lower, upper }),
      value_pos: Gtk.PositionType.RIGHT,
      hexpand: true,
      halign: Gtk.Align.END,
    });
    scale.set_draw_value(true);
    scale.set_value(settingsData.get());
    scale.set_size_request(400, 15);

    scale.connect('value-changed', (sw) => {
      const newval = sw.get_value();
      if (newval != settingsData.get()) {
        settingsData.set(newval);
      }
    });

    const row = Adw.ActionRow.new();
    row.set_title(labelText);
    row.add_suffix(scale);
    group.add(row);

    return scale;
  }

  /**
   * Add slider
   *
   * @param {Adw.PreferencesGroup} group
   * @param {string} labelText
   * @param {Object} settingsData
   * @param {Object} values
   */
  addComboBox(group, labelText, settingsData, values) {
    const combo = new Gtk.ComboBoxText({
      hexpand: true,
      halign: Gtk.Align.END,
      valign: Gtk.Align.CENTER,
    });

    values.forEach((val, i) => {
      combo.append_text(val);
      if (settingsData.get() === val) combo.set_active(i);
    });

    combo.connect('changed', () => {
      const selected = combo.get_active_text();
      if (selected) settingsData.set(selected);
    });

    const row = Adw.ActionRow.new();
    row.set_title(labelText);
    row.add_suffix(combo);
    group.add(row);

    return combo;
  }

  /**
   * Add boolean switch
   *
   * @param {Adw.PreferencesGroup} group
   * @param {string} labelText
   * @param {Object} settingsData
   */
  addBooleanSwitch(group, labelText, settingsData) {
    const gtkSwitch = new Gtk.Switch({ hexpand: true, halign: Gtk.Align.END });
    gtkSwitch.set_active(settingsData.get());
    gtkSwitch.set_valign(Gtk.Align.CENTER);

    gtkSwitch.connect('state-set', (sw) => {
      const newval = sw.get_active();
      if (newval != settingsData.get()) {
        settingsData.set(newval);
      }
    });

    const row = Adw.ActionRow.new();
    row.set_title(labelText);
    row.add_suffix(gtkSwitch);
    group.add(row);

    return gtkSwitch;
  }

  /**
   * Find widget by type
   *
   * @param {object} parent
   * @param {object} type
   */
  findWidgetByType(parent, type) {
    for (const child of [...parent]) {
      if (child instanceof type) return child;

      const match = this.findWidgetByType(child, type);
      if (match) return match;
    }
    return null;
  }
}
