# GNOME Magic Lamp for GNOME Shell

[![Build and Release Extension](https://github.com/kyleabaker/gnome-magic-lamp/actions/workflows/release.yaml/badge.svg)](https://github.com/kyleabaker/gnome-magic-lamp/actions)
![CI Status](https://github.com/kyleabaker/gnome-magic-lamp/actions/workflows/ci.yaml/badge.svg)
[![Latest Release](https://img.shields.io/github/v/release/kyleabaker/gnome-magic-lamp)](https://github.com/kyleabaker/gnome-magic-lamp/releases)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

GNOME Magic Lamp is a window minimize and maximize animation effect for GNOME Shell which is inspired by Compiz.

[<img src="assets/screenshot.png" width="100%">](https://extensions.gnome.org/extension/)

### Quick Install (One-Liner)

If you have `curl` and `jq` installed, you can install the latest release directly without cloning the repository:

```bash
curl -s https://api.github.com/repos/kyleabaker/gnome-magic-lamp/releases/latest \
| jq -r '.assets[] | select(.name | endswith(".zip")) | .browser_download_url' \
| xargs curl -L -o extension.zip \
&& gnome-extensions install --force extension.zip \
&& rm extension.zip
```

> **Note:** After running this, you must **restart GNOME Shell** (Alt+F2, type `r`, Enter) or log out/in for the extension to appear in your list. Then, enable it via the "Extensions" app.

### Contributions

Got ideas, suggestions, or found a bug?  
[Open an issue on GitHub](https://github.com/kyleabaker/gnome-magic-lamp/issues) or submit a **pull request**.

### Build from Source

To build and install this extension from source, ensure you have the standard build utilities and GNOME development tools installed.

#### 1. Install Build Tools

- **Ubuntu/Debian:** `sudo apt install build-essential libglib2.0-bin zip jq npm`
- **Fedora:** `sudo dnf install make gcc glib2 zip jq npm`
- **Arch:** `sudo pacman -S base-devel glib2 zip jq npm`

#### 2. Compilation & Installation

Run these commands from the project root directory:

- **Build the package:** Creates a distributable `.zip` file in the `dist/` folder.
  ```bash
  make -f tools/Makefile
  ```
- **Install locally:** Compiles schemas and deploys the extension to your local GNOME folder.
  ```bash
  make -f tools/Makefile install
  ```

#### 3. Activate the Extension

GNOME requires a session refresh to detect new local extensions:

- **Xorg:** Press `Alt` + `F2`, type `r`, and press `Enter`.
- **Wayland:** Log out and log back in.
- **Enable:** Use the **Extensions** app or run:
  ```bash
  gnome-extensions enable gnome-magic-lamp@kyleabaker.github.com
  ```

### Release Process

To share a new version on the GitHub Releases tab:

1.  **Update Version:** Increment the `version` field in `metadata.json`.
2.  **Generate Bundle:** Run `make -f tools/Makefile` to generate the latest `.zip` in the `dist/` directory.
3.  **Publish on GitHub:**
    - Navigate to **Releases** > **Draft a new release**.
    - Tag the version (e.g., `v1.0.0`).
    - Upload the `.zip` file located in the `dist/` folder.
    - Click **Publish release**.

### Automated Release Process

This project uses GitHub Actions to automate the creation of releases. When you are ready to publish a new version, follow these steps:

1. **Update Version:** Increment the `version` field in `metadata.json` (and ensure your changes are committed).
2. **Tag the Release:** Create a new git tag and push it to GitHub.

```bash
# Replace v1.0.1 with your new version number
git add .
git commit -m "Update to version 1.0.1"
git tag v1.0.1
git push origin main --tags
```

3. **Automated Build:** GitHub Actions will automatically:
   - Detect the new tag.
   - Install build dependencies and run the `Makefile`.
   - Generate the extension bundle.
   - Create a new GitHub Release with the `.zip` file attached as a downloadable asset.

4. **Verify:** After about 60 seconds, check your **Releases** tab on GitHub to see the new version and its compiled extension package.

## Troubleshooting

In case of update error please restart GNOME Shell via:

- **Xorg:** Press `Alt` + `F2`, type `r`, and press `Enter`.
- **Wayland:** Log out and log back in.

## License

This extension is distributed under the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
