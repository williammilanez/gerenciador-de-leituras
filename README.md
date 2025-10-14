<p align="center">
  <img alt="Ícone Reading Manager" src="./assets/images/logotipo.png" width="65px" />
  <img alt="Logo Reading Manager" src="./assets/images/capa-projeto.png" width="200px" />
</p>

<p align="center">
  Gerenciador de leituras interativo, desenvolvido com **HTML, CSS e JavaScript**, permitindo organizar livros por status, avaliação e comentários.<br/>
  Totalmente **responsivo** e funcional em **Desktop**, **Tablet** e **Mobile**.
</p>

<p align="center">
  <a href="#-tecnologias">Tecnologias</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-projeto">Projeto</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-layout">Layout</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-licença">Licença</a>
</p>

<p align="center">
  <img src="https://img.shields.io/static/v1?label=PRs&message=welcome&color=1D4ED8&labelColor=0F172A" alt="PRs welcome!" />
  <img alt="License" src="https://img.shields.io/static/v1?label=license&message=MIT&color=1D4ED8&labelColor=0F172A">
</p>

---

<p align="center">
  <img alt="Preview do projeto" src="./assets/projeto.png" width="100%">
</p>

## 🚀 Tecnologias

Desenvolvido com:

- **HTML5**
- **CSS3** (Flexbox e Grid)
- **JavaScript (Vanilla)**

---

## 💻 Projeto

**Gerenciador de Leituras** é um sistema interativo para gerenciar livros que você quer ler, está lendo ou já leu.  
Ele permite cadastrar, editar, excluir e filtrar livros por status, além de permitir uma avaliação com estrelas e adição de comentários. O projeto foca em **UX responsiva**, persistência de dados no **LocalStorage** e acessibilidade.

Funcionalidades principais:

- **CRUD completo**: adicionar, editar e excluir livros.
- **Sistema de avaliação** com estrelas e botão "Limpar".
- **Busca e filtragem** por título, autor e status.
- **Estatísticas dinâmicas** de leitura.
- **Modal responsivo** com foco inicial e reset de formulário.
- **Persistência de dados** usando LocalStorage, incluindo fallback de imagens.

---

## 🔖 Layout

Visualize o layout do projeto:

- **Preview Desktop/Tablet/Mobile:** ![Preview](./assets/projeto.png)
- Cards com título, autor, status, avaliação e comentário.
- Modal interativo para adicionar ou editar livros.
- Estatísticas em tempo real.

---

## 📝 Como Usar

1. Clone ou baixe o repositório.
2. Abra `index.html` no navegador.
3. Clique em **Adicionar Livro** para cadastrar livros.
4. Use **Editar** ou **Excluir** nos cards de livros existentes.
5. Pesquise e filtre livros pelo título, autor ou status, utilizando o campo de busca ou a opção de select.
6. Avalie livros com o sistema de estrelas.
7. Confira estatísticas atualizadas na página.

---

## 📁 Estrutura de Pastas

```
reading-manager/
│
├── assets/
│ ├── icons/...
│ └── images/...
│
├── js/
│ ├── main.js
│ ├── modal.js
│ ├── storage.js
│ └── ui.js
│
├── styles.css/
│ ├── form.css
│ ├── global.css
│ ├── index.css
│ ├── main.css
│ ├── reset.css
│ └── responsividade.css
│
├── .gitignore
├── index.html
├── LICENSE
└── README.md
```

---

## 📚 Aprendizados Aplicados

- Estruturação semântica de HTML e uso de ARIA.
- Layout responsivo com Flexbox e Grid.
- Manipulação do DOM e eventos com JavaScript.
- Validação de formulários e UX interativa.
- Persistência de dados com LocalStorage.
- Boas práticas de acessibilidade (foco, teclado, aria-labels).

---

## 👨‍💻 Autor

Desenvolvido por **Rocketseat**
Adaptado e implementado por **William Milanez**
📍 Pós-graduação Dev Start – Desafio Fase 2 – _Gerenciador de Leituras_

---

## 📄 Licença

Este projeto está sob a licença **MIT**.  
Este projeto é de uso educacional e livre para fins de estudo e prática pessoal.

---
