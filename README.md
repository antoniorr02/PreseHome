# Repositorio para una plataforma de comercio electrónico de expansión Pyme

Este repositorio busca realizar el desarrollo de una tienda online funcional para un pequeño negocio familiar, con el fin de hacer frente a la creciente competencia inasumible de las grandes superficies que amenaza con su inviabilidad económica.

## Tecnologías empleadas

### Frontend:
- Astro: Framework para el desarrollo de sitios web estáticos, enfocado en rendimiento y optimización SEO. Su arquitectura de "islas" permite una carga eficiente al cargar solo lo necesario en JavaScript. Además, puedes integrar otras tecnologías en el futuro sin complicaciones.
- React: Librería de JavaScript para construir interfaces de usuario mediante componentes reutilizables. En este proyecto, se emplea dentro de Astro para desarrollar partes interactivas (como formularios, modales y componentes dinámicos) gracias al enfoque de "islas de interactividad". React permite mantener una estructura modular y facilita la gestión del estado y de la lógica de la interfaz, integrándose de forma eficiente con el resto del frontend.
- Tailwind CSS: Framework de CSS que permite crear interfaces personalizadas rápidamente sin necesidad de escribir CSS adicional. Con la versión 4.0, mejora la velocidad de compilación y optimiza la carga con dependencias más ligeras.

### Backend:
- Fastify: Framework para Node.js, diseñado para ser rápido y escalable. Se utiliza para crear la parte del servidor de la tienda online, con un enfoque en rendimiento.
- Node.js: Entorno de ejecución para JavaScript en el servidor. Permite ejecutar el código JavaScript en el backend, gestionando las peticiones y respuestas HTTP.

### Base de Datos:
- PostgreSQL: Sistema de gestión de bases de datos relacional, elegido por su fiabilidad, seguridad e integridad de los datos. Es adecuado para manejar datos estructurados, como los de una tienda online.
- Prisma: ORM (Object-Relational Mapping) para PostgreSQL, que permite interactuar con la base de datos de manera más sencilla, proporcionando una capa de abstracción y un sistema de migraciones para gestionar los esquemas de la base de datos.

### Arquitectura:
- SSG (Static Site Generation): Enfoque para generar sitios web estáticos, donde las páginas se generan en el momento de la construcción y no en el servidor en cada petición. Esto mejora la velocidad, escalabilidad y optimización SEO.

## Lanzar la aplicacion
Para lanzar la página será necesario seguir un par de pasos sencillos:

1. Compilar la página en Astro para que cree los archivos estáticos que se pasarán a la carpeta public del servidor con Fastify durante la contenerización con Docker.

```
npm run build
```

2. Una vez realizado el build, será necesario el uso de `docker-compose`, así como definir un archivo `.env` dentro de la carpeta backend, con las variables de configuración necesarias.

```
docker-compose run --build
```

Respecto al `.env` las variables a definir serán:

```
DATABASE_URL="postgresql://<user>:<password>@db:5432/<db>"

EMAIL_USER=xxx@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
RECIPIENT_EMAIL=xxx@gmail.com
JWT_SECRET=xxx
COOKIE_SECRET=xxx

GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx

IN=production
```

NOTA: Para hacer el despliegue debe de clonarse la rama `milestone 7`, ya que la rama `master` contiene la web en producción.
Para ejecutar en producción, bastaría con hacer en el directorio raíz:
```
npm run dev
node backend/src/server.js
```
