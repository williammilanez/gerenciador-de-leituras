(function (global) {
  document.addEventListener("DOMContentLoaded", () => {
    function migrateMissingImages() {
      const books = global.App?.Storage?.getBooks?.() || [];
      const DEFAULT_COVER = "./assets/images/default-cover.png";
      let changed = false;

      const newBooks = books.map((b) => {
        if (!b.image || typeof b.image !== "string" || b.image.trim() === "") {
          changed = true;
          return { ...b, image: DEFAULT_COVER };
        }
        return b;
      });

      if (changed) {
        global.App.Storage.saveBooks(newBooks);
        console.info(
          "✅ Migração concluída: imagens ausentes substituídas por default-cover."
        );
      }
    }

    migrateMissingImages();

    if (
      global.App &&
      global.App.UI &&
      typeof global.App.UI.init === "function"
    ) {
      global.App.UI.init();
    } else {
      console.error("App.UI não disponível");
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = document.getElementById("book-form-modal");
        if (modal && !modal.hidden) {
          global.App.Modal.close();
        }
      }
    });

    const radios = document.querySelectorAll('#book-form input[name="rating"]');
    radios.forEach((r) => {
      r.addEventListener("change", (e) => {
        const v = Number(e.target.value || 0);
        global.App.Modal.updateStarsVisual(v);
      });
    });
  });
})(window);
