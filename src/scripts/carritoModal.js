document.addEventListener("DOMContentLoaded", () => {
    const carritoBtn = document.getElementById("carrito");
  
    if (carritoBtn) {
      carritoBtn.addEventListener("click", () => {
        const event = new Event("openCartModal");
        document.dispatchEvent(event);
      });
    }
  });
  