// Renderização, handlers do DOM (add/edit/delete/search), manipula Storage e Modal.

(function (global) {
  const Storage = global.App.Storage;
  const Modal = global.App.Modal;
  const form = document.getElementById("book-form");
  const listEl = document.querySelector(".cards-list");
  const statsEls = {
    total: document.getElementById("stat-total"),
    want: document.getElementById("stat-want"),
    reading: document.getElementById("stat-reading"),
    read: document.getElementById("stat-read"),
  };
  const searchInput = document.getElementById("search-input");
  const filterSelect = document.getElementById("search-filter");

  // Template de criação do card (DOM)
  function createCard(book) {
    const li = document.createElement("li");
    li.className = "card";
    li.setAttribute("role", "listitem");
    li.dataset.id = book.id;

    const article = document.createElement("article");
    article.className = "card__inner";
    article.setAttribute("aria-labelledby", `title-${book.id}`);

    // imagem
    const img = document.createElement("img");
    img.src = book.image || "./assets/images/default-cover.png";
    img.alt = `Capa do livro ${book.title}`;
    img.onerror = () => {
      img.src = "./assets/images/default-cover.png";
    };

    const bookCard = document.createElement("div");
    bookCard.className = "bookCard";

    const titleWrap = document.createElement("div");
    titleWrap.className = "title";
    const h2 = document.createElement("h2");
    h2.className = "title-book";
    h2.id = `title-${book.id}`;
    h2.textContent = book.title;
    const pAuthor = document.createElement("p");
    pAuthor.className = "author";
    pAuthor.textContent = book.author;
    titleWrap.appendChild(h2);
    titleWrap.appendChild(pAuthor);

    const desc = document.createElement("div");
    desc.className = "description";
    const statusP = document.createElement("p");
    statusP.className = "stats-book";
    // aplicar classe de acordo com status
    if (book.status === "lido") statusP.classList.add("done");
    else if (book.status === "lendo") statusP.classList.add("inProgress");
    else statusP.classList.add("default");
    statusP.setAttribute("aria-label", `Status: ${book.status}`);
    // Texto legível
    const statusTextMap = {
      lido: "Lido",
      lendo: "Lendo",
      "quero-ler": "Quero ler",
    };
    statusP.textContent = statusTextMap[book.status] || book.status;

    // estrelas (a CSS already handles fill via data-rating)
    const starsDiv = document.createElement("div");
    starsDiv.className = "stars";
    starsDiv.setAttribute("role", "img");
    starsDiv.setAttribute("aria-label", `Avaliação: ${book.rating} de 5`);
    starsDiv.dataset.rating = String(book.rating || 0);
    const fallback = document.createElement("span");
    fallback.setAttribute("aria-hidden", "true");
    // fallback: preenchimento textual simples
    const filledStars = "★".repeat(book.rating || 0);
    const emptyStars = "☆".repeat(5 - (book.rating || 0));
    fallback.textContent = filledStars + emptyStars;
    starsDiv.appendChild(fallback);

    const commentP = document.createElement("p");
    commentP.className = "comment";
    commentP.textContent = book.comment || "";

    desc.appendChild(statusP);
    desc.appendChild(starsDiv);
    desc.appendChild(commentP);

    bookCard.appendChild(titleWrap);
    bookCard.appendChild(desc);

    // footer com botões
    const footer = document.createElement("div");
    footer.className = "cardFooter";

    const btnEdit = document.createElement("button");
    btnEdit.className = "edit-book";
    btnEdit.type = "button";
    btnEdit.setAttribute("aria-label", `Editar ${book.title}`);
    btnEdit.innerHTML = `<img src="./assets/icons/pen.svg" alt="" aria-hidden="true" /> Editar`;
    btnEdit.addEventListener("click", () => startEdit(book.id));

    const btnDelete = document.createElement("button");
    btnDelete.className = "delete-book";
    btnDelete.type = "button";
    btnDelete.setAttribute("aria-label", `Excluir ${book.title}`);
    btnDelete.innerHTML = `<img src="./assets/icons/trash-red-bright.svg" alt="" aria-hidden="true" /> Excluir`;
    btnDelete.addEventListener("click", () => handleDelete(book.id));

    footer.appendChild(btnEdit);
    footer.appendChild(btnDelete);

    article.appendChild(img);
    article.appendChild(bookCard);
    article.appendChild(footer);
    li.appendChild(article);

    return li;
  }

  function renderBooks(booksList) {
    const list = booksList || Storage.getBooks();
    listEl.innerHTML = "";
    if (!list.length) {
      listEl.innerHTML =
        '<p class="empty">Nenhum livro adicionado ainda. Comece adicionando seu primeiro livro!</p>';
      updateStats(list);
      return;
    }
    list.forEach((book) => {
      const card = createCard(book);
      listEl.appendChild(card);
    });
    updateStats(list);
  }

  function updateStats(list) {
    const total = list.length;
    const want = list.filter((b) => b.status === "quero-ler").length;
    const reading = list.filter((b) => b.status === "lendo").length;
    const read = list.filter((b) => b.status === "lido").length;
    if (statsEls.total) statsEls.total.textContent = total;
    if (statsEls.want) statsEls.want.textContent = want;
    if (statsEls.reading) statsEls.reading.textContent = reading;
    if (statsEls.read) statsEls.read.textContent = read;
  }

  // Deletar com confirmação
  function handleDelete(id) {
    if (!confirm("Deseja realmente excluir este livro?")) return;
    Storage.deleteBook(id);
    renderBooks();
  }

  // começa edição: preenche o form e abre modal
  function startEdit(id) {
    const books = Storage.getBooks();
    const book = books.find((b) => b.id === id);
    if (!book) return;
    // preencher form
    form.dataset.editId = id; // marca que estamos editando
    form.querySelector("#book-title").value = book.title || "";
    form.querySelector("#book-author").value = book.author || "";
    form.querySelector("#book-image").value = book.image || "";
    form.querySelector("#book-status").value = book.status || "quero-ler";
    form.querySelector("#book-comment").value = book.comment || "";
    // rating radios
    const r = Math.max(0, Number(book.rating || 0));
    const radio = form.querySelector(`#rating-${r}`);
    if (radio) radio.checked = true;
    Modal.updateStarsVisual(r);
    Modal.open();
  }

  // ao submeter o formulário: add ou update
  function handleSubmit(e) {
    e.preventDefault();
    const DEFAULT_COVER = "./assets/images/default-cover.png";

    const data = {
      title: form.querySelector("#book-title").value.trim(),
      author: form.querySelector("#book-author").value.trim(),
      image: (function () {
        const url = form.querySelector("#book-image").value.trim();
        // se estiver vazio ou apenas espaços, retorna a imagem default
        return url ? url : DEFAULT_COVER;
      })(),
      status: form.querySelector("#book-status").value,
      comment: form.querySelector("#book-comment").value.trim(),
      rating: (function () {
        const checked = form.querySelector('input[name="rating"]:checked');
        return checked ? Number(checked.value) : 0;
      })(),
    };

    // valida campos obrigatórios
    if (!data.title || !data.author) {
      alert("Preencha o título e o autor (campos obrigatórios).");
      return;
    }

    if (form.dataset.editId) {
      const editId = Number(form.dataset.editId);
      Storage.updateBook(editId, data);
    } else {
      const newBook = {
        id: Date.now(),
        ...data,
        createdAt: new Date().toISOString(),
      };
      Storage.addBook(newBook);
    }

    Modal.close();
    renderBooks();
  }

  // start search/filter
  function applySearchFilter() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const status = filterSelect?.value || "all";
    let list = Storage.getBooks();

    if (q) {
      list = list.filter((b) => {
        return (
          (b.title || "").toLowerCase().includes(q) ||
          (b.author || "").toLowerCase().includes(q)
        );
      });
    }
    if (status && status !== "all") {
      list = list.filter((b) => b.status === status);
    }
    renderBooks(list);
  }

  // rating control: capturar clicks nas estrelas do form e marcar radio correspondente
  function initRatingControls() {
    const stars = document.querySelectorAll("#book-form .star");
    stars.forEach((star) => {
      star.addEventListener("click", (e) => {
        const val = Number(star.dataset.value || 0);
        // marcar radio correspondente
        const radio = form.querySelector(`#rating-${val}`);
        if (radio) radio.checked = true;
        Modal.updateStarsVisual(val);
      });

      // teclado: Enter/Space para marcar
      star.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const val = Number(star.dataset.value || 0);
          const radio = form.querySelector(`#rating-${val}`);
          if (radio) radio.checked = true;
          Modal.updateStarsVisual(val);
        }
      });
    });

    // limpar avaliação
    const clearBtn = document.querySelector("#book-form .clear-rating");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const r0 = form.querySelector("#rating-0");
        if (r0) r0.checked = true;
        Modal.updateStarsVisual(0);
      });
    }
  }

  // inicialização do UI (listeners)
  function init() {
    // listeners form
    if (form) form.addEventListener("submit", handleSubmit);

    // search input
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        // debounce simples: usar timeout — mas aqui chamamos direto para simplicidade
        applySearchFilter();
      });
    }
    if (filterSelect) {
      filterSelect.addEventListener("change", applySearchFilter);
    }

    // rating controls
    initRatingControls();

    // render inicial
    renderBooks();
  }

  // export
  global.App = global.App || {};
  global.App.UI = {
    renderBooks,
    init,
    createCard,
  };
})(window);
