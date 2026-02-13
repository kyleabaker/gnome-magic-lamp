# Makefile for GNOME gnome-magic-lamp Windows Extension
#
# Usage:
#   make -f tools/Makefile          # Builds the zip package (default)
#   make -f tools/Makefile install  # Builds and installs the extension
#
# Note: This Makefile expects to be run from the project root directory.

SHELL := /bin/bash
.ONESHELL:
.DELETE_ON_ERROR:
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules

# ---------------------------
# Configuration
# ---------------------------

# Commands
NPM := npm
JQ := jq
GLIB_COMPILE_SCHEMAS := glib-compile-schemas
ZIP := zip
GNOME_EXTENSIONS := gnome-extensions

# Files and Directories
METADATA := metadata.json
DIST_DIR := ./dist
SCHEMAS_DIR := schemas
DIST_FILES := assets schemas src extension.js LICENSE metadata.json prefs.js README.md

# Colors for logging
BLUE := \033[1;34m
YELLOW := \033[1;33m
RED := \033[1;31m
NC := \033[0m

# Helper functions
define log_info
    echo -e '$(BLUE)[INFO]$(NC) $1'
endef

define log_warn
    echo -e '$(YELLOW)[WARN]$(NC) $1'
endef

define log_error
    echo -e '$(RED)[ERROR]$(NC) $1'
endef

# Read UUID from metadata.json (evaluated lazily)
UUID = $(shell $(JQ) -r .uuid $(METADATA))
ZIPNAME = $(UUID).zip
ZIP_PATH = $(DIST_DIR)/$(ZIPNAME)

# ---------------------------
# Targets
# ---------------------------

.PHONY: all check format lint schemas clean build zip install

all: zip

# Check required commands
check:
	@for cmd in $(NPM) $(JQ) $(GLIB_COMPILE_SCHEMAS) $(ZIP) $(GNOME_EXTENSIONS); do \
		command -v $$cmd >/dev/null 2>&1 || { $(call log_error, "$$cmd is required but not installed."); exit 1; }; \
	done

# Format code
format: check
	@$(call log_info, "Formatting code...")
	$(NPM) run format

# Lint code
lint: format
	@$(call log_info, "Running lint...")
	$(NPM) run lint

# Compile schemas
schemas: check
	@if [ -d "$(SCHEMAS_DIR)" ]; then \
		$(call log_info, "Compiling schemas..."); \
		$(GLIB_COMPILE_SCHEMAS) "$(SCHEMAS_DIR)/"; \
	fi

# Clean dist folder
clean:
	@$(call log_info, "Clearing dist folder...")
	rm -rf "$(DIST_DIR)"

# Prepare dist folder
build: lint schemas clean
	@$(call log_info, Preparing dist folder...)
	mkdir -p "$(DIST_DIR)"
	@for path in $(DIST_FILES); do \
		if [ -e "$$path" ]; then \
			cp -r "$$path" "$(DIST_DIR)/$$path"; \
			$(call log_info, Copied $$path to $(DIST_DIR)/$$path); \
		else \
			$(call log_warn, $$path does not exist, skipping.); \
		fi \
	done

# Create zip package
zip: build
	@$(call log_info, "Creating zip package...")
	(cd "$(DIST_DIR)" && $(ZIP) -r "$(ZIPNAME)" . >/dev/null)
	@$(call log_info, "Packaged as: $(ZIP_PATH)")

# Install and enable extension
install: zip
	@$(call log_info, "Installing GNOME extension...")
	$(GNOME_EXTENSIONS) install "$(ZIP_PATH)" --force
	@$(call log_info, "Enabling GNOME extension...")
	$(GNOME_EXTENSIONS) enable "$(UUID)"
	@$(call log_info, "Build and install complete. Please restart GNOME Shell (Alt+F2, r) or log out/in.")
