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
  const statsContainer = document.getElementById("stats");

  function createCard(book) {
    const li = document.createElement("li");
    li.className = "card";
    li.setAttribute("role", "listitem");
    li.dataset.id = book.id;

    const article = document.createElement("article");
    article.className = "card__inner";
    article.setAttribute("aria-labelledby", `title-${book.id}`);

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
    titleWrap.append(h2, pAuthor);

    const desc = document.createElement("div");
    desc.className = "description";
    const statusP = document.createElement("p");
    statusP.className = "stats-book";
    if (book.status === "lido") statusP.classList.add("done");
    else if (book.status === "lendo") statusP.classList.add("inProgress");
    else statusP.classList.add("default");
    statusP.setAttribute("aria-label", `Status: ${book.status}`);
    const statusTextMap = {
      lido: "Lido",
      lendo: "Lendo",
      "quero-ler": "Quero ler",
    };
    statusP.textContent = statusTextMap[book.status] || book.status;

    const starsDiv = document.createElement("div");
    starsDiv.className = "stars";
    starsDiv.setAttribute("role", "img");
    starsDiv.setAttribute("aria-label", `Avaliação: ${book.rating} de 5`);
    starsDiv.dataset.rating = String(book.rating || 0);
    const fallback = document.createElement("span");
    fallback.setAttribute("aria-hidden", "true");
    const rating = Math.floor(Number(book.rating) || 0);
    fallback.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);
    starsDiv.dataset.rating = String(rating);

    const commentP = document.createElement("p");
    commentP.className = "comment";
    commentP.textContent = book.comment || "";

    desc.append(statusP, starsDiv, commentP);
    bookCard.append(titleWrap, desc);

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

    footer.append(btnEdit, btnDelete);
    article.append(img, bookCard, footer);
    li.appendChild(article);

    return li;
  }

  function renderBooks(booksList) {
    const list = booksList || Storage.getBooks();
    listEl.innerHTML = "";

    if (!list.length) {
      const all = Storage.getBooks();
      listEl.innerHTML = !all.length
        ? '<p class="empty">Nenhum livro adicionado ainda. Comece adicionando seu primeiro livro!</p>'
        : '<p class="empty">Nenhum livro encontrado para os critérios informados.</p>';
      updateStats([]);
      if (statsContainer) statsContainer.style.display = "none";
      return;
    }

    if (statsContainer) statsContainer.style.display = "";
    list.forEach((book) => listEl.appendChild(createCard(book)));
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

  function handleDelete(id) {
    if (!confirm("Deseja realmente excluir este livro?")) return;
    Storage.deleteBook(id);
    renderBooks();
  }

  function startEdit(id) {
    const book = Storage.getBooks().find((b) => b.id === id);
    if (!book) return;

    form.dataset.editId = id;
    form.querySelector("#book-title").value = book.title || "";
    form.querySelector("#book-author").value = book.author || "";
    form.querySelector("#book-image").value = book.image || "";
    form.querySelector("#book-status").value = book.status || "quero-ler";
    form.querySelector("#book-comment").value = book.comment || "";

    const r = Math.floor(Math.max(0, Number(book.rating || 0)));
    const radio = form.querySelector(`#rating-${r}`);
    if (radio) radio.checked = true;
    Modal.updateStarsVisual(r);

    const formTitle = form.querySelector(".form-title");
    const submitBtn = form.querySelector('button[type="submit"]');
    if (formTitle) formTitle.textContent = "Editar Livro";
    if (submitBtn) submitBtn.textContent = "Atualizar";

    Modal.open();
  }

  function startAdd() {
    form.reset();
    delete form.dataset.editId;
    const formTitle = form.querySelector(".form-title");
    const submitBtn = form.querySelector('button[type="submit"]');
    if (formTitle) formTitle.textContent = "Adicionar Livro";
    if (submitBtn) submitBtn.textContent = "Adicionar";
    const r0 = form.querySelector("#rating-0");
    if (r0) r0.checked = true;
    Modal.updateStarsVisual(0);
    Modal.open();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const DEFAULT_COVER = "./assets/images/default-cover.png";

    const data = {
      title: form.querySelector("#book-title").value.trim(),
      author: form.querySelector("#book-author").value.trim(),
      image: form.querySelector("#book-image").value.trim() || DEFAULT_COVER,
      status: form.querySelector("#book-status").value,
      comment: form.querySelector("#book-comment").value.trim(),
      rating: (() => {
        const checked = form.querySelector('input[name="rating"]:checked');
        let r = checked ? parseInt(checked.value, 10) : 0;
        if (isNaN(r) || r < 0) r = 0;
        if (r > 5) r = 5;
        return r;
      })(),
    };

    if (!data.title || !data.author) {
      alert("Preencha o título e o autor (campos obrigatórios).");
      return;
    }

    if (form.dataset.editId) {
      const editId = Number(form.dataset.editId);
      Storage.updateBook(editId, data);
    } else {
      Storage.addBook({
        id: Date.now(),
        ...data,
        createdAt: new Date().toISOString(),
      });
    }

    Modal.close();
    renderBooks();
  }

  function applySearchFilter() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const status = filterSelect?.value || "all";
    let list = Storage.getBooks();
    if (q) {
      list = list.filter(
        (b) =>
          (b.title || "").toLowerCase().includes(q) ||
          (b.author || "").toLowerCase().includes(q)
      );
    }
    if (status !== "all") list = list.filter((b) => b.status === status);
    renderBooks(list);
  }

  function initRatingControls() {
    const stars = document.querySelectorAll("#book-form .star");
    stars.forEach((star) => {
      star.addEventListener("click", () => {
        const val = Number(star.dataset.value || 0);
        const radio = form.querySelector(`#rating-${val}`);
        if (radio) radio.checked = true;
        Modal.updateStarsVisual(val);
      });
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

    const clearBtn = document.querySelector("#book-form .clear-rating");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const r0 = form.querySelector("#rating-0");
        if (r0) r0.checked = true;
        Modal.updateStarsVisual(0);
      });
    }
  }

  function init() {
    if (form) form.addEventListener("submit", handleSubmit);
    if (searchInput) searchInput.addEventListener("input", applySearchFilter);
    if (filterSelect)
      filterSelect.addEventListener("change", applySearchFilter);
    initRatingControls();
    const addBookBtn = document.getElementById("add-book");
    if (addBookBtn) addBookBtn.addEventListener("click", startAdd);
    renderBooks();
  }

  global.App = global.App || {};
  global.App.UI = { renderBooks, init, createCard };
})(window);
