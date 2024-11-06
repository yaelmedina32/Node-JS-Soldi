window.onload = function () {
    const defaultSection = document.querySelector('.swagger-ui');  //  .info .url
  
    if (defaultSection) {
      defaultSection.innerHTML = `
          <h3>Bienvenido a la documentación de la API</h3>
          <p>Esta es la documentación interactiva de la API de ejemplo.</p>
          <p>Explora los endpoints en el menú izquierdo.</p>
          <p>Si tienes alguna pregunta, contacta con nuestro equipo de soporte.</p>
          <p>Enlaces útiles:</p>
          <ul>
            <li><a href="/">Página de inicio</a></li>
            <li><a href="/contacto">Contacto Enrique Morales</a></li>
          </ul>
        `;
    }
  };