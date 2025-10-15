(function (global) {
  const LS_KEY = "readingManager.books";

  function getBooks() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Erro ao ler localStorage", e);
      return [];
    }
  }

  function saveBooks(list) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Erro ao salvar localStorage", e);
    }
  }

  function addBook(book) {
    if (!book || typeof book !== "object") {
      console.warn("Tentativa de adicionar livro inválido:", book);
      return null;
    }
    if (!book.title || typeof book.title !== "string" || !book.title.trim()) {
      console.warn("Livro sem título não será salvo:", book);
      return null;
    }
    if (
      !book.author ||
      typeof book.author !== "string" ||
      !book.author.trim()
    ) {
      console.warn("Livro sem autor não será salvo:", book);
      return null;
    }

    const books = getBooks();
    books.push(book);
    saveBooks(books);
    return book;
  }

  function updateBook(id, patch) {
    const books = getBooks();
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    books[idx] = { ...books[idx], ...patch };
    saveBooks(books);
    return books[idx];
  }

  function deleteBook(id) {
    const books = getBooks().filter((b) => b.id !== id);
    saveBooks(books);
  }

  global.App = global.App || {};
  global.App.Storage = {
    getBooks,
    saveBooks,
    addBook,
    updateBook,
    deleteBook,
    LS_KEY,
  };
})(window);
