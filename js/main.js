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

    // validações usando validação nativa do HTML
    if (!form.reportValidity()) {
      // se reportValidity retornar false, o navegador mostra a mensagem
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

// ======== Rating interativo (estrelas) ========
function initStarsControl() {
  const starsControl = document.querySelector(".stars-control");
  if (!starsControl) return;

  const starsVisual = starsControl.querySelector(".stars-visual");
  const stars = Array.from(starsVisual.querySelectorAll(".star"));
  const radios = Array.from(starsControl.querySelectorAll(".rating-radio"));
  const clearBtn = starsControl.querySelector(".clear-rating");

  // Mantém o rating atual localmente (0..5)
  let currentRating = 0;

  // Helpers
  function setRating(r) {
    currentRating = Math.max(0, Math.min(5, Number(r) || 0));
    // marcar rádios
    const radioToCheck = starsControl.querySelector(
      `.rating-radio[value="${currentRating}"]`
    );
    if (radioToCheck) radioToCheck.checked = true;
    // atualizar visual
    updateVisual();
  }

  function updateVisual() {
    stars.forEach((s) => {
      const v = Number(s.dataset.value);
      if (v <= currentRating) s.classList.add("filled");
      else s.classList.remove("filled");
    });
  }

  function clearRating() {
    currentRating = 0;
    const r0 = starsControl.querySelector('.rating-radio[value="0"]');
    if (r0) r0.checked = true;
    updateVisual();
  }

  // Inicializa (valor vindo do radio se houver)
  const checked = starsControl.querySelector(".rating-radio:checked");
  if (checked) {
    currentRating = Number(checked.value) || 0;
    updateVisual();
  } else {
    clearRating();
  }

  // Eventos: hover e click nas estrelas
  stars.forEach((starElem) => {
    const value = Number(starElem.dataset.value);

    starElem.addEventListener("mousemove", (e) => {
      // hover preview: preenche até a estrela sobre a qual o mouse está
      stars.forEach((s) => {
        const sv = Number(s.dataset.value);
        if (sv <= value) s.classList.add("filled");
        else s.classList.remove("filled");
      });
    });

    starElem.addEventListener("mouseleave", () => {
      // restaurar para o valor selecionado
      updateVisual();
    });

    starElem.addEventListener("click", () => {
      // define rating e marca o radio correspondente
      setRating(value);
    });

    // keyboard accessibility: allow Enter/Space to set rating when focused
    starElem.tabIndex = 0;
    starElem.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        setRating(value);
      }
      // Left/Right to navigate
      if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        const next = Math.max(0, currentRating - 1);
        setRating(next);
      }
      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        const next = Math.min(5, currentRating + 1);
        setRating(next);
      }
    });
  });

  // limpar
  clearBtn.addEventListener("click", () => {
    clearRating();
    // garantir foco no primeiro campo (opcional)
    // form.elements['title'].focus();
  });

  // Expor funções para uso externo (populate/edit)
  return {
    setRating,
    clearRating,
    getRating: () => currentRating,
    refreshFromForm: () => {
      const checked = starsControl.querySelector(".rating-radio:checked");
      if (checked) setRating(Number(checked.value) || 0);
      else clearRating();
    },
  };
}

// Criar instância (uma só, pois há apenas um modal)
const starsController = initStarsControl();

// ===== Integrar com form reset / populate =====
// Quando abrimos o modal para adicionar (no handler de addBookBtn click) já chamamos form.reset()
// Após um reset (ou ao abrir modal) queremos garantir visual consistente
if (form) {
  // Ao resetar manualmente, atualizar visual
  form.addEventListener("reset", () => {
    // espera microtick para que os radios sejam realmente resetados
    setTimeout(() => {
      if (starsController) starsController.refreshFromForm();
    }, 0);
  });

  // Ao popular o form para edição (quando populateFormForEdit é chamado) os radios já são marcados
  // então forçamos refresh no controller (às vezes populateFormForEdit define antes do initStarsControl)
  // Para garantir, chamamos refresh após um pequeno delay quando modal é aberto para edição.
}

// Ao abrir modal (adicionar ou editar) — garantir que estrelas reflitam o estado
const originalOpenModal = openModal;
function openModalWithStars() {
  originalOpenModal();
  // microtick para garantir que form radio states estejam prontos
  setTimeout(() => {
    if (starsController) starsController.refreshFromForm();
    // also ensure scroll inside modal places first input into view
    const firstControl = modal.querySelector("input, select, textarea, button");
    if (firstControl) firstControl.focus();
  }, 10);
}
// substituir referência de openModal por esta nova função usada nos event listeners:
if (addBookBtn) {
  // remove old listener and add new one safely
  addBookBtn.replaceWith(addBookBtn.cloneNode(true));
  // rebind selector because node changed
  const newAddBtn = document.getElementById("add-book");
  newAddBtn.addEventListener("click", () => {
    clearEditingFlag();
    form.reset();
    openModalWithStars();
  });
}

// Também garantir que quando populateFormForEdit é chamado, o controller seja atualizado
function populateFormForEdit(book) {
  if (!form) return;
  form.elements["title"].value = book.title || "";
  form.elements["author"].value = book.author || "";
  form.elements["image"]
    ? (form.elements["image"].value = book.image || "")
    : null;
  form.elements["status"].value = book.status || "quero-ler";

  // marcar radio de rating (se existir)
  const rating = Number(book.rating) || 0;
  const radio = form.querySelector(`.rating-radio[value="${rating}"]`);
  if (radio) radio.checked = true;
  else {
    const r0 = form.querySelector('.rating-radio[value="0"]');
    if (r0) r0.checked = true;
  }

  form.elements["comment"].value = book.comment || "";

  // armazenar o id do book a ser editado (para usar no submit)
  form.dataset.editingId = book.id;

  // atualizar visual das estrelas
  if (starsController) starsController.refreshFromForm();

  // abrir modal
  openModalWithStars();
}
