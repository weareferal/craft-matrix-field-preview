var MFP = MFP || {};

(function ($) {
  /**
   * Block Type Modal
   *
   * A custom modal that extends the default Craft modal to help house our
   * custom block types
   */
  MFP.BlockTypeModal = Garnish.Modal.extend({
    init: function (container, settings, config, defaultImageUrl) {
      Garnish.Modal.prototype.init.call(this, container, settings);

      this.config = config;
      this.defaultImageUrl = defaultImageUrl;

      this.buildModal();
      this.buildGridItems();
    },

    buildModal: function () {
      this.$container.addClass("modal mfp-modal");
      this.$body = $('<div class="body"/>').appendTo(this.$container);
      this.$footer = $('<footer class="footer"/>').appendTo(this.$container);
      this.$buttons = $('<div class="buttons right"/>').appendTo(this.$footer);
      this.$cancelBtn = $(
        '<div class="btn">' + Craft.t("app", "Close") + "</div>"
      ).appendTo(this.$buttons);

      this.$cancelBtn.on(
        "click",
        function () {
          this.hide();
        }.bind(this)
      );
    },

    buildGridItems: function () {
      this.$grid = $("<div>", {
        class: "mfp-grid",
      });

      $.each(
        this.config,
        function (i, blockTypeConfig) {
          var $item = $("<div>", {
            class: "mfp-grid-item",
          }).attr("data-block-type", blockTypeConfig.handle);

          var $img = $("<div>", {
            class: "mfp-grid-item__image mfp-grid-item__image--default",
          }).append($("<img>").attr("src", this.defaultImageUrl));

          var $name = $("<h2>", {
            class: "mfp-grid-item__name",
            text: blockTypeConfig.name,
          });

          var $description = $("<p>", {
            class: "mfp-grid-item__description",
          });

          if (blockTypeConfig["image"]) {
            $img.removeClass("mfp-grid-item__image--default");
            $img.children("img").attr("src", blockTypeConfig["image"]);
          }
          if (blockTypeConfig["name"]) {
            $name.text(blockTypeConfig["name"]);
          }
          if (blockTypeConfig["description"]) {
            $description.text(blockTypeConfig["description"]);
          }

          $item.prepend($img, $name, $description);

          $item.on(
            "click",
            function () {
              this.trigger("gridItemClicked", {
                config: blockTypeConfig,
              });
            }.bind(this)
          );

          this.$grid.append($item);
        }.bind(this)
      );

      this.$body.append(this.$grid);
    },
  });
})(jQuery);
