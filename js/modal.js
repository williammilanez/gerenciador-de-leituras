(function (global) {
  const modalEl = document.getElementById("book-form-modal");
  const addBtn = document.getElementById("add-book");
  const cancelBtn = document.getElementById("cancel-add");

  function open(triggerEl) {
    if (!modalEl) return;
    modalEl.hidden = false;
    modalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    addBtn?.setAttribute("aria-expanded", "true");
    const firstInput = modalEl.querySelector("input, textarea, select, button");
    if (firstInput) firstInput.focus();
    modalEl.__trigger = triggerEl || null;
  }

  function close() {
    if (!modalEl) return;
    modalEl.hidden = true;
    modalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    addBtn?.setAttribute("aria-expanded", "false");
    const trigger = modalEl.__trigger || addBtn;
    if (trigger && typeof trigger.focus === "function") trigger.focus();

    const form = document.getElementById("book-form");
    if (form) {
      form.reset();
      delete form.dataset.editId;
      const r0 = form.querySelector("#rating-0");
      if (r0) r0.checked = true;
      updateStarsVisual(0);
    }
  }

  function updateStarsVisual(value = 0) {
    const stars = document.querySelectorAll("#book-form .star");
    stars.forEach((s) => {
      const v = Number(s.dataset.value || 0);
      if (v <= value) s.classList.add("filled");
      else s.classList.remove("filled");
    });
  }

  addBtn?.addEventListener("click", (e) => open(e.currentTarget));
  cancelBtn?.addEventListener("click", close);
  modalEl?.addEventListener("click", (e) => {
    if (e.target === modalEl) close();
  });

  global.App = global.App || {};
  global.App.Modal = { open, close, updateStarsVisual };
})(window);
