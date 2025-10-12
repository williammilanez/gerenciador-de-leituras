// Inicializa a aplicação (carrega Storage/Modal/UI)
(function (global) {
  document.addEventListener("DOMContentLoaded", () => {
    // --- Migração: garantir imagem default para livros sem capa ---
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

    // Executa a migração antes de carregar a interface
    migrateMissingImages();

    // --- Inicializa UI ---
    if (
      global.App &&
      global.App.UI &&
      typeof global.App.UI.init === "function"
    ) {
      global.App.UI.init();
    } else {
      console.error("App.UI não disponível");
    }

    // --- Fechamento por ESC (fecha modal quando aberto) ---
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = document.getElementById("book-form-modal");
        if (modal && !modal.hidden) {
          global.App.Modal.close();
        }
      }
    });

    // --- Sincroniza visual das estrelas quando o usuário muda manualmente ---
    const radios = document.querySelectorAll('#book-form input[name="rating"]');
    radios.forEach((r) => {
      r.addEventListener("change", (e) => {
        const v = Number(e.target.value || 0);
        global.App.Modal.updateStarsVisual(v);
      });
    });
  });
})(window);
