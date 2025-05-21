#!/bin/bash
zip -r "gnome-magic-lamp@kyleabaker.github.com.zip" . -x '.git*' -x "*assets*" -x "README.md" -x "zip.sh"