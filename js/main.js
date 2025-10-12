/* Seletores principais (baseados no seu HTML) */
const addBookBtn = document.getElementById("add-book");
const modal = document.getElementById("book-form-modal"); // backdrop/dialog container
const form = modal ? modal.querySelector("form") : null; // formulário dentro do modal
const cancelBtn = modal ? modal.querySelector("#cancel-add") : null;
const cardsList = document.querySelector(".cards-list"); // <ul> onde os cards ficam
const statsCards = Array.from(document.querySelectorAll("#stats .stat-card")); // cartões de estatística

/* Estado e persistência (localStorage) */
const LS_KEY = "minhaBiblioteca.books";
let books = []; // array de objetos { id, title, author, image, status, rating, comment }

/* Carrega do localStorage ao iniciar */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    books = JSON.parse(raw);
  } catch (err) {
    console.error("Erro ao carregar books do localStorage", err);
    books = [];
  }
}

/* Salva no localStorage */
function saveToStorage() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(books));
  } catch (err) {
    console.error("Erro ao salvar books no localStorage", err);
  }
}

/* Abertura / fechamento do modal (acessível) */
let previouslyFocusedElement = null;

function openModal() {
  if (!modal) return;
  previouslyFocusedElement = document.activeElement;
  modal.removeAttribute("hidden");
  document.body.classList.add("modal-open");

  // foco no primeiro controle do form
  const firstControl = modal.querySelector("input, select, textarea, button");
  if (firstControl) firstControl.focus();

  document.addEventListener("keydown", handleKeyDown);
  modal.addEventListener("click", handleBackdropClick);
}

function closeModal() {
  if (!modal) return;
  modal.setAttribute("hidden", "");
  document.body.classList.remove("modal-open");

  if (previouslyFocusedElement && previouslyFocusedElement.focus) {
    previouslyFocusedElement.focus();
  }

  document.removeEventListener("keydown", handleKeyDown);
  modal.removeEventListener("click", handleBackdropClick);
}

function handleKeyDown(e) {
  if (e.key === "Escape") closeModal();
}

function handleBackdropClick(e) {
  // se o clique foi no backdrop (no próprio contêiner modal), fecha
  if (e.target === modal) closeModal();
}

/* Mapeamento de status -> classe (para combinar com seus cards) */
function statusToClass(status) {
  // "Quero ler" -> class "default"
  if (status === "quero-ler") return "default";
  // "Lendo" -> class "inProgress"
  if (status === "lendo") return "inProgress";
  // "Lido" -> class "done"
  if (status === "lido" || status === "lido") return "done";

  return "default";
}

function statusToLabel(status) {
  if (status === "quero-ler") return "Quero ler";
  if (status === "lendo") return "Lendo";
  if (status === "lido") return "Lido";
  return "Quero ler";
}

/* Cria elemento do card (li.card) a partir de um objeto book */
function createCardElement(book) {
  // book: { id, title, author, image, status, rating, comment }
  const li = document.createElement("li");
  li.className = "card";
  li.dataset.id = book.id;

  // gerar id único para aria-labelledby do título
  const titleId = `titleBook-${book.id}`;

  li.innerHTML = `
    <article class="card__inner" aria-labelledby="${titleId}">
      <img src="${escapeHtml(
        book.image || "./assets/images/default-cover.png"
      )}" alt="Capa do livro ${escapeHtml(
    book.title
  )}" onerror="this.src='./assets/images/default-cover.png'"/>
      <div class="bookCard">
        <div class="title">
          <h2 id="${titleId}" class="title-book">${escapeHtml(book.title)}</h2>
          <p class="author">${escapeHtml(book.author)}</p>
        </div>

        <div class="description">
          <p class="stats-book ${statusToClass(
            book.status
          )}" aria-label="Status: ${statusToLabel(book.status)}">
            ${statusToLabel(book.status)}
          </p>

          <div class="stars" role="img" aria-label="Avaliação: ${
            book.rating || 0
          } de 5" data-rating="${book.rating || 0}"></div>

          <p class="comment">${escapeHtml(book.comment || "No comment.")}</p>
        </div>
      </div>

      <div class="cardFooter">
        <button class="edit-book" type="button" aria-label="Editar livro">
          <img src="./assets/icons/pen.svg" alt="Símbolo de editar" />
          Editar
        </button>
        <button class="delete-book" type="button" aria-label="Excluir livro">
          <img src="./assets/icons/trash-red-bright.svg" alt="Símbolo de excluir" />
          Excluir
        </button>
      </div>
    </article>
  `;

  // after card is appended or after selecting the stars element...
  const starsEl = li.querySelector(".stars");
  const rating = Number(book.rating) || 0;
  const percent = (Math.max(0, Math.min(5, rating)) / 5) * 100; // 0..100
  starsEl.style.setProperty("--rating-percent", `${percent}%`);

  // adicionar listener do botão excluir
  const deleteBtn = li.querySelector(".delete-book");
  deleteBtn.addEventListener("click", () => {
    removeBook(book.id);
  });

  // editar - placeholder (pode abrir modal com dados preenchidos)
  const editBtn = li.querySelector(".edit-book");
  editBtn.addEventListener("click", () => {
    // comportamento simples: abrir modal e preencher com os dados deste livro para editar
    openModal();
    populateFormForEdit(book);
  });

  return li;
}

/* pequena função para escapar strings antes de inserir em innerHTML */
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* ==================================================
   Atualiza a lista na UI e os contadores
   ================================================== */
function renderList() {
  // limpar lista
  cardsList.innerHTML = "";

  // inserir cada book
  books.forEach((b) => {
    const card = createCardElement(b);
    cardsList.appendChild(card);
  });

  updateStats();
}

/* Atualiza os números (Total / Quero ler / Lendo / Lidos) */
function updateStats() {
  const total = books.length;
  const quero = books.filter((b) => b.status === "quero-ler").length;
  const lendo = books.filter((b) => b.status === "lendo").length;
  const lidos = books.filter((b) => b.status === "lido").length;

  // Assuming statsCards exist in the order: Total, Quero ler, Lendo, Lidos
  if (statsCards.length >= 4) {
    statsCards[0].querySelector(".stat-number").textContent = total;
    statsCards[1].querySelector(".stat-number").textContent = quero;
    statsCards[2].querySelector(".stat-number").textContent = lendo;
    statsCards[3].querySelector(".stat-number").textContent = lidos;
  } else {
    // fallback: try to find by label text
    statsCards.forEach((card) => {
      const label = card
        .querySelector(".stat-label")
        ?.textContent?.trim()
        ?.toLowerCase();
      if (label === "total")
        card.querySelector(".stat-number").textContent = total;
      if (label === "quero ler")
        card.querySelector(".stat-number").textContent = quero;
      if (label === "lendo")
        card.querySelector(".stat-number").textContent = lendo;
      if (label === "lidos")
        card.querySelector(".stat-number").textContent = lidos;
    });
  }
}

/* Adicionar / Remover / Editar */
function addBook(book) {
  books.unshift(book); // adiciona no topo
  saveToStorage();
  renderList();
}

function removeBook(id) {
  books = books.filter((b) => b.id !== id);
  saveToStorage();
  renderList();
}

/* Preenche o formulário com dados para edição (simples) */
function populateFormForEdit(book) {
  if (!form) return;
  form.elements["title"].value = book.title || "";
  form.elements["author"].value = book.author || "";
  form.elements["image"]
    ? (form.elements["image"].value = book.image || "")
    : null;
  form.elements["status"].value = book.status || "quero-ler";
  if (form.elements["rating"]) {
    // se tiver radio name rating, marcar o radio correspondente
    const rating = String(book.rating || "");
    const radio = form.querySelector(`input[name="rating"][value="${rating}"]`);
    if (radio) radio.checked = true;
  }
  form.elements["comment"].value = book.comment || "";

  // armazenar o id do book a ser editado (para usar no submit)
  form.dataset.editingId = book.id;
}

/* Limpa marcação de edição do form */
function clearEditingFlag() {
  if (!form) return;
  delete form.dataset.editingId;
}

/* Form submit: cria novo livro ou salva edição */
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // coletar dados
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    // rating: se for radio, pode vir como string numérica
    const rating = fd.get("rating") || 0;

    // normalizar objeto
    const bookObj = {
      id: form.dataset.editingId || String(Date.now()),
      title: (data.title || "").trim(),
      author: (data.author || "").trim(),
      image: (data.image || "").trim(),
      status: data.status || "quero-ler",
      rating: Number(rating) || 0,
      comment: (data.comment || "").trim(),
    };

    // validações simples
    if (!bookObj.title || !bookObj.author) {
      // foco no primeiro campo faltante
      if (!bookObj.title) form.elements["title"].focus();
      else form.elements["author"].focus();
      return;
    }

    if (form.dataset.editingId) {
      // editar: substituir o item existente
      books = books.map((b) => (b.id === bookObj.id ? bookObj : b));
      clearEditingFlag();
    } else {
      // adicionar novo
      addBook(bookObj);
    }

    saveToStorage();

    // fechar modal e resetar
    closeModal();
    form.reset();
  });
}

/* Cancelar no modal */
if (cancelBtn) {
  cancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    clearEditingFlag();
    form.reset();
    closeModal();
  });
}

/* Abrir modal ao clicar no botão "Adicionar livro" */
if (addBookBtn) {
  addBookBtn.addEventListener("click", () => {
    clearEditingFlag();
    form.reset();
    openModal();
  });
}

/* Inicialização na carga da página */
function init() {
  loadFromStorage();
  renderList();
}

init();

const starsInput = document.querySelector(".stars-input");
const starsOverlay = starsInput.querySelector(".stars-overlay");
const starRadios = starsInput.querySelectorAll("input[name='rating']");

function updateStars(rating) {
  starsOverlay.style.width = `${rating * 20}%`; // 1 estrela = 20%
}

// Atualiza quando clica
starRadios.forEach((radio, index) => {
  radio.addEventListener("change", () => {
    updateStars(index + 1);
  });
});

// Atualiza no hover
starsInput.addEventListener("mousemove", (e) => {
  const rect = starsInput.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const hoverRating = Math.ceil((offsetX / rect.width) * 5);
  starsOverlay.style.width = `${hoverRating * 20}%`;
});

starsInput.addEventListener("mouseleave", () => {
  const selected = document.querySelector(
    ".stars-input input[name='rating']:checked"
  );
  if (selected) {
    updateStars(Number(selected.value));
  } else {
    starsOverlay.style.width = "0%";
  }
});
