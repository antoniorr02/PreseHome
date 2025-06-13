document.addEventListener("DOMContentLoaded", (e) => {
    const carritoBtn = document.getElementById("carrito");
  
    if (carritoBtn) {
      carritoBtn.addEventListener("click", () => {
        e.preventDefault();
        const event = new Event("openCartModal");
        document.dispatchEvent(event);
      });
    }
  });
  