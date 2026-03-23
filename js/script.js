document.addEventListener("DOMContentLoaded", () => {
  const cartButtons = document.querySelectorAll(".add-cart-btn");
  const contactForm = document.getElementById("contactForm");
  const formMessage = document.getElementById("formMessage");
  const navLinks = document.querySelectorAll('.navbar a[href^="#"]');

  cartButtons.forEach((button) => {
    button.addEventListener("click", () => {
      alert("Producto añadido al carrito");
    });
  });

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      formMessage.textContent = "¡Gracias! Hemos recibido tu mensaje.";
      contactForm.reset();
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
});
