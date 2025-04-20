# Repositorio para una plataforma de comercio electrónico de expansión Pyme

Este repositorio busca realizar el desarrollo de una tienda online funcional para un pequeño negocio familiar, con el fin de hacer frente a la creciente competencia inasumible de las grandes superficies que amenaza con su inviabilidad económica.

## Tecnologías empleadas

### Frontend:
- Astro: Framework para el desarrollo de sitios web estáticos, enfocado en rendimiento y optimización SEO. Su arquitectura de "islas" permite una carga eficiente al cargar solo lo necesario en JavaScript. Además, puedes integrar otras tecnologías en el futuro sin complicaciones.
- Tailwind CSS: Framework de CSS de utilidad que permite crear interfaces personalizadas rápidamente sin necesidad de escribir CSS adicional. Con la versión 4.0, mejora la velocidad de compilación y optimiza la carga con dependencias más ligeras.

### Backend:
- Fastify: Framework para Node.js, diseñado para ser rápido y escalable. Se utiliza para crear la parte del servidor de la tienda online, con un enfoque en rendimiento.
- Node.js: Entorno de ejecución para JavaScript en el servidor. Permite ejecutar el código JavaScript en el backend, gestionando las peticiones y respuestas HTTP.

### Base de Datos:
- PostgreSQL: Sistema de gestión de bases de datos relacional, elegido por su fiabilidad, seguridad e integridad de los datos. Es adecuado para manejar datos estructurados, como los de una tienda online.
- Prisma: ORM (Object-Relational Mapping) para PostgreSQL, que permite interactuar con la base de datos de manera más sencilla, proporcionando una capa de abstracción y un sistema de migraciones para gestionar los esquemas de la base de datos.

### Arquitectura:
- SSG (Static Site Generation): Enfoque para generar sitios web estáticos, donde las páginas se generan en el momento de la construcción y no en el servidor en cada petición. Esto mejora la velocidad, escalabilidad y optimización SEO.

## Gestor de tareas

## Contenerización con Docker para automatizar pruebas en CI