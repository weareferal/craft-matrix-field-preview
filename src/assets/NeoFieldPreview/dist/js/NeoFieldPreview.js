var MFP = MFP || {};

(function ($) {
  MFP.NeoFieldPreview = Garnish.Base.extend({
    configs: {},
    previewsUrl: "matrix-field-preview/preview/get-previews",

    init: function () {
      this.defaultImageUrl = fieldPreviewDefaultImage;
      this.previewIconUrl = previewIcon;

      if (typeof Neo !== "undefined") {
        Garnish.on(
          window.Neo.Input,
          "afterInit",
          {},
          function (ev) {
            console.debug("Neo input initialised:", ev);
            this.onInputLoaded(ev.target);
          }.bind(this)
        );
      }
    },

    /**
     * Input loaded
     *
     * When this neo field has loaded, fetch the config from the server and
     * initialise the field and block types.
     */
    onInputLoaded: function (neoInput) {
      var fieldHandle = neoInput._name;
      this.getConfig(fieldHandle)
        .done(
          function (response) {
            if (response["success"]) {
              console.debug("Preview config fetched:", response);
              var config = response["config"];
              this.configs[fieldHandle] = config;
              this.initialiseNeoInput(neoInput, config);
            } else {
              console.error(response["error"]);
            }
          }.bind(this)
        )
        .fail(
          function (response) {
            console.error(
              "Error fetching config for neo field:",
              fieldHandle,
              response
            );
          }.bind(this)
        );
    },

    /**
     * Initialise
     *
     * Add event handlers for a particular input and initialise it
     */
    initialiseNeoInput: function (neoInput, config) {
      neoInput.on(
        "addBlock",
        function (ev) {
          this.setupNeoBlock(ev.block, config);
        }.bind(this)
      );

      neoInput.on(
        "removeBlock",
        function (ev) {
          console.debug("Block removed: ", ev.block);
        }.bind(this)
      );

      this.setupNeoInput(neoInput, config);
    },

    /**
     * Setup input
     *
     * Create dom elements for an initial entire neo input
     */
    setupNeoInput: function (neoInput, config) {
      console.debug("Setting up input: ", neoInput);

      neoInput.$container.addClass("mfp-field mfp-neo-field");

      var $button = this.createButton(config);
      neoInput.$buttonsContainer.find("> .ni_buttons").append($button);

      // Now handle all child blocks
      neoInput._blocks.forEach(
        function (neoBlock) {
          this.setupNeoBlock(neoBlock, config);
        }.bind(this)
      );
    },

    /**
     * Setup block
     *
     * Create dom elements for a particular neo block
     */
    setupNeoBlock: function (neoBlock, config) {
      console.debug("Setting up block:", neoBlock._blockType._handle, neoBlock);
      var blockTypeHandle = neoBlock._blockType._handle;
      var blockTypeConfig = config["blockTypes"][blockTypeHandle];
      var neoBlockTypes = neoBlock.getButtons().getBlockTypes();

      if (!blockTypeConfig["image"] && !blockTypeConfig["description"]) {
        console.warn("No block types configured for this Neo block");
        return;
      }

      // Add inline preview
      neoBlock.mfpBlockTypePreview = new MFP.BlockTypeInlinePreview(
        $("<div>"),
        blockTypeConfig,
        this.defaultImageUrl
      );
      neoBlock.$bodyContainer.prepend(neoBlock.mfpBlockTypePreview.$target);

      if (neoBlock.$buttonsContainer.length > 0) {
        // Filter out the block types we need to display for this particular
        // neo block. Not all neo blocks show all block types, so we should
        // only display those relevant
        var filteredConfig = this.filterConfigForBlockTypes(
          neoBlockTypes,
          config
        );

        // Create preview trigger button
        neoBlock.$mfpButton = this.createButton(config);
        neoBlock.$buttonsContainer
          .find(".ni_buttons")
          .append(neoBlock.$mfpButton);

        // Create modal and grid
        neoBlock.mfpModal = new MFP.BlockTypeModal($("<div>"), {
          autoShow: false,
          closeOtherModals: true,
          hideOnEsc: true,
          resizable: false,
        });
        neoBlock.mfpGrid = new MFP.BlockTypeGrid(
          $("<div>"),
          filteredConfig,
          this.defaultImageUrl
        );
        neoBlock.mfpModal.$body.append(neoBlock.mfpGrid.$target);
        neoBlock.$container.append(neoBlock.mfpModal.$container);

        // When preview button clicked
        neoBlock.$mfpButton.on("click", function () {
          neoBlock.mfpModal.show();
        });

        // When a modal grid item is clicked
        neoBlock.mfpGrid.on(
          "gridItemClicked",
          {},
          function (event) {
            var neoBlockType = $.grep(neoBlockTypes, function (neoBlockType) {
              return neoBlockType.getHandle() === event.config.handle;
            })[0];
            neoBlock.trigger("newBlock", {
              blockType: neoBlockType,
              level: neoBlock.getLevel() + 1,
            });
            neoBlock.mfpModal.hide();
          }.bind(this)
        );
      }
    },

    /**
     *
     */
    filterConfigForBlockTypes(neoBlockTypes, config) {
      var filteredConfigs = {};
      for (var i = 0; i < neoBlockTypes.length; i++) {
        var neoBlockType = neoBlockTypes[i];
        var _config = config["blockTypes"][neoBlockType["_handle"]];
        if (_config) {
          filteredConfigs[_config["handle"]] = _config;
        }
      }
      return filteredConfigs;
    },

    /**
     * Get config
     *
     * Get the config for a particular neo input from the server
     */
    getConfig: function (fieldHandle) {
      return $.get({
        url: Craft.getActionUrl(this.previewsUrl),
        data: {
          type: "neo",
          fieldHandle: fieldHandle,
        },
        dataType: "json",
      });
    },

    /**
     * Create button
     *
     * Button that launches a modal overlay for a particular neo block
     */
    createButton: function (config) {
      // NOTE: unlike Matrix fields, neo fields cannot be "taken over"
      return (
        $("<div>", {
          class: "mfp-modal-trigger btn dashed",
        })
          // .css("background-image", "url('" + this.previewIconUrl + "')")
          .text(config["field"]["buttonText"])
      );
    },
  });
})(jQuery);
