// Responsável por abrir/fechar o modal do formulário e controlar foco.
// Expor App.Modal.open() e App.Modal.close()

(function (global) {
  const modalEl = document.getElementById("book-form-modal");
  const addBtn = document.getElementById("add-book");
  const cancelBtn = document.getElementById("cancel-add");

  function open(triggerEl) {
    if (!modalEl) return;
    modalEl.hidden = false;
    document.body.classList.add("modal-open");
    addBtn?.setAttribute("aria-expanded", "true");
    // coloca foco no primeiro input do formulário
    const firstInput = modalEl.querySelector("input, textarea, select, button");
    if (firstInput) firstInput.focus();
    // guarda referência de quem abriu
    modalEl.__trigger = triggerEl || null;
  }

  function close() {
    if (!modalEl) return;
    modalEl.hidden = true;
    document.body.classList.remove("modal-open");
    addBtn?.setAttribute("aria-expanded", "false");
    // devolve foco para quem abriu, se existir
    const trigger = modalEl.__trigger || addBtn;
    if (trigger && typeof trigger.focus === "function") trigger.focus();
    // remove edit state
    const form = document.getElementById("book-form");
    if (form) {
      form.reset();
      delete form.dataset.editId;
      // reset rating radios to 0
      const r0 = form.querySelector("#rating-0");
      if (r0) r0.checked = true;
      updateStarsVisual(0);
    }
  }

  // Atualiza a visualização das estrelas no formulário (usa classes 'filled')
  function updateStarsVisual(value = 0) {
    const stars = document.querySelectorAll("#book-form .star");
    stars.forEach((s) => {
      const v = Number(s.dataset.value || 0);
      if (v <= value) s.classList.add("filled");
      else s.classList.remove("filled");
    });
  }

  // listeners para abrir/fechar
  if (addBtn) {
    addBtn.addEventListener("click", (e) => open(e.currentTarget));
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", close);
  }

  // fechar ao clicar fora do box
  if (modalEl) {
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) close();
    });
  }

  // export
  global.App = global.App || {};
  global.App.Modal = {
    open,
    close,
    updateStarsVisual,
  };
})(window);
