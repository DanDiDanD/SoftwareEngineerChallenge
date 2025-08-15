# Design Choices & Rationale

Este documento es la parte más importante de tu entrega. Es tu oportunidad de explicar tu proceso de pensamiento, las compensaciones que consideraste, y el razonamiento detrás de tu implementación. La comunicación clara y concisa es una habilidad crítica para cualquier ingeniero, y estamos emocionados de conocer cómo abordaste el problema.

---

## 1. Application Architecture Overview

Por favor proporciona una visión general de alto nivel de la arquitectura de tu aplicación. Explica cómo estructuraste tus componentes, el flujo de datos, y la relación entre tu código cliente y servidor.

**Example:**

Mi aplicación sigue una arquitectura moderna de Next.js con los siguientes componentes clave:

- **Gallery Page (`/`)**: Componente servidor que obtiene datos de configuración usando el patrón de llamadas del lado del servidor de tRPC desde la consulta `setup.all`. Renderiza una cuadrícula responsiva de tarjetas de configuración con imágenes optimizadas y funcionalidad de me gusta.

- **Setup Card Component**: Componente cliente que maneja la interacción del botón de me gusta usando el estado de React (o `useOptimistic` para implementación avanzada). Gestiona el estado local para conteos de me gusta sin persistencia.

- **Submission Page (`/submit`)**: Contiene un formulario con validación del lado del cliente y procesamiento del lado del servidor a través de Server Actions de Next.js. Usa Zod para validación tanto en cliente como en servidor.

- **Server Action**: Maneja el envío de formularios, valida datos con esquema Zod, y registra envíos exitosos. Devuelve errores de validación al cliente para mostrar.

- **tRPC Setup Router**: Proporciona endpoints `setup.all` y `setup.byId` con datos ficticios, asegurando seguridad de tipos a través de la aplicación.

El flujo de datos sigue: Cliente → Consulta tRPC → Componente Servidor → UI para lecturas, y Formulario Cliente → Server Action → Validación → Respuesta para escrituras.

---

## 2. Key Technical Decisions & Trade-Offs

### Data Fetching Strategy

- **¿Por qué elegiste tRPC sobre REST APIs o lectura directa de archivos?**: El challenge requiere el uso de tRPC, sin embargo, alguno de los beneficios de utilizar tRPC que he notado sería:

  - Validar y tipar datos desde una sola definición tanto para client como server, ganando así una gran consistencia en la fiabilidad de los datos. En REST se tendría que definir los tipos en el client y el server por separado, perdiendo robustez.
  - Los routers de tRPC se encuentran en el mismo repositorio que el cliente, creando una documentación viviente a través de los tipos que es intuitiva de leer y navegar.

- **Server Components vs Client Components**: Se adoptó el "server-first approach" de Next.js: todos los componentes son Server Components por defecto, migrando a Client Components solo cuando requieren interactividad. Esto optimiza la experiencia del usuario al enviar la mayor parte del contenido HTML pre-renderizado y la aplicación solo se hidrata lo interactivo.

  - **Server Components**: La mayoría del proyecto permanece como Server Components. Las páginas principales ([Setup Galley Page]("./apps/nextjs/src/app/page.tsx") y [Setup Form Page]("./apps/nextjs/src/app/submit/page.tsx")) renderizan el contenido inicial en el servidor, mejorando el First Contentful Paint. El componente [SetupGallery]("./apps/nextjs/src/app/_components/setup-gallery/index.tsx") también es un Server Component que ejecuta el fetching de datos con tRPC directamente en el servidor. Todos los componentes de presentación pura (cards, layouts, skeletons) permanecen como Server Components.
  - **Client Components**: Solo [LikeButton]("./apps/nextjs/src/app/_components/setup-gallery/LikeButton.tsx") y [CreateSetupForm]("./apps/nextjs/src/app/_components/setup-submit/createSetupForm.tsx") son Client Components, específicamente porque requieren interactividad: manejan estado local con hooks (useState, useForm, useOptimistic), responden a eventos del usuario, y ejecutan Server Actions.

### State Management for Likes

- **¿Cómo implementaste la funcionalidad de me gusta?** Debido al tiempo reducido de la prueba, se utilizó un React State con los estados `likes` y `isLiked` para la funcionalidad de "me gusta". Esto pudo haber sido manejado con un custom hook.

- **¿Implementaste actualizaciones optimistas?** Sí, utilicé el hook `useOptimistic` en el Client Component [`LikeButton`](./apps/nextjs/src/app/_components/setup-gallery/LikeButton.tsx). Este actualiza inmediatamente el contador de likes (+1/-1) y alterna el estado `isLiked` mientras el Server Action [`likeSetup`](./apps/nextjs/src/app/actions.ts) se ejecuta en segundo plano. Si la acción falla (se simula un 25% de probabilidad de error del action), el estado se revierte automáticamente a los valores previos, garantizando consistencia de datos.

- **Local vs Persistent State**: Como primer paso añadiría sincronización entre pestañas utilizando localStorage events, permitiendo que, una vez que **likeSetup action** se resuelva correctamente, los cambios se reflejen instantaneamente en todas las pestañas. El siguiente paso sería integrar el servidor tRPC con una base de datos PostgreSQL + Prisma, utilizando servicios como Vercel Postgres o una base de datos PostgreSQL alojada en un servidor Node.js + Framework en este mismo repositorio.

### Form Handling & Validation

- **Validación del lado del cliente vs del servidor**: Se realizó validaciones tanto del lado del cliente como en el servidor. Este esquema se reutiliza en ambos casos.

- **Diseño de esquema Zod**: Se define **SetupSchema** basado en la interface TS **Setup**, de este schema se extrae **CreateSetupSchema** (y da la posibilidad de poder seguir extrayendo schemas para el CRUD) el cuál se utiliza para la validación en el componente **CreateSetupForm** (integrando dentro de un **useForm**) y en el action **createSetup**.

- **Manejo de errores**: Del lado del cliente, los errores se muestran debajo del input que contiene el error, estos errores son gestionados automáticamente por el hook **useForm** el cuál tiene definido como schema validador **CreateSetupSchema**. También se maneja un caso borde en el que se muestra un mensaje de error genérico si ocurre un error en el server que no esté relacionado con la validación de tipos.

### Component Architecture & Design Patterns

- **Composición de componentes**: Alguno de los patrones que utilicé para mis componentes fueron los siguiente:

  - **Compound Components**: Si bien este patrón está integrado nativamente en **shadcn/ui**, también se implementa en componentes custom como `<SetupSkeleton />`. Su estructura incluye `<SetupSkeleton.List />` y `<SetupSkeleton.Item />`, manteniendo el componente abierto para extensiones pero cerrado para modificaciones en caso la UI de Setup crezca.
  - **Atomic Design**: Si bien no se implementa la estructura de carpetas tradicional del Atomic Design, sí se respeta su filosofía de composición, creando una jerarquía de componentes desde los más básicos hasta los más complejos. Por ejemplo: `Atoms (Button) → Molecules (LikeButton) → Organisms (SetupItem) → Templates (SetupList)`.
  - **Single Responsability**: Cada componente tiene una sola responsabilidad: Ejemplo: `SetupItem solo renderiza un setup`, `LikeButton: solo maneja likes`, `CreateSetupForm: solo maneja creación`
  - **Render Props Pattern**: El componente **FormField** de **shadcn/ui** implementa este patrón de forma nativa, automatizando el control de los inputs y la validación a través del schema definido.
    Se pudo haber agregado el Hooks Pattern
  - **Container/Presentational Pattern**: Divide los componentes en dos tipos funcionales: **Containers** responsables de la obtención y manejo de datos (**SetupGallery** usando tRPC), y **Presentational** enfocados únicamente en la presentación visual (**SetupList** sin lógica
    de negocio, solo UI).

- **Enfoque de estilos**: Para el enfoque de estilos, se siguió la siguiente metodología:

  - **UI Library Components**: se utiliza los componentes **shadcn/ui** para los componentes genéricos que una aplicación web pueda tener. Funcionan como Atoms en el enfoque de Atomic Design (altamente reutilizables)
  - **Custom Componentes**: se utilizan componentes custom que encapsulan lógica y/o UI de features específicas, facilitando la separación de responsabilidades y el mantenimiento del código. (ej. `LikeButton`, `CreateSetupForm`).
  - **Tailwind CSS classes directly:** Se agregan clases de Tailwind CSS directamente para estilos puntuales y disposiciones específicas que no requieren abstracción en componentes separados. Se aplica cuando la reutilización es limitada o el estilo es contextual al componente específico (ej. `SetupList`, `SetupItem`).

- **Optimización de imágenes**: Se utilizó el componente Image de Next.js que proporciona optimizaciones como lazy loading y redimensionado dinámico de forma automática; además, se agrega el prop `sizes` para servir diferentes resoluciones según el dispositivo, y se agrega `aspect-video` mantiene una proporción consistente. Fue necesario configurar el remotePatterns en `next.config.js` para permitir imágenes de `https://images.unsplash.com`.

### Type Safety & Developer Experience

- **Integración de TypeScript**: ¿Cómo aseguraste la seguridad de tipos a través de tus llamadas tRPC, manejo de formularios, y props de componentes?
- **Límites de error**: ¿Implementaste manejo de errores para llamadas API fallidas o errores de componentes?

---

## 3. Future Improvements & Next Steps

Ningún proyecto está verdaderamente "terminado". Si tuvieras otra semana para trabajar en esto, ¿qué harías después? ¿Qué priorizarías, y por qué?

**⏰ If You Ran Out of Time:** Si no completaste toda la implementación dentro de 3-4 horas, por favor documenta lo que habrías hecho aquí. ¡Entendemos completamente y queremos respetar tu tiempo! Describe tu enfoque planeado para cualquier componente no terminado.

Considera estas áreas:

### User Experience Enhancements

- **Búsqueda y filtrado**: ¿Cómo implementarías búsqueda por título/autor o filtrado por etiquetas?
- **Scroll infinito o paginación**: ¿Cómo manejarías conjuntos de datos más grandes?
- **Mejoras de diseño responsivo**: ¿Qué optimizaciones específicas para móvil agregarías?

### Performance Optimizations

- **Estrategias de carga de imágenes**: ¿Cómo implementarías carga diferida, marcadores de posición borrosos, o conversión WebP?
- **Estrategias de caché**: ¿Dónde agregarías caché (navegador, CDN, lado del servidor)?
- **Optimización de paquete**: ¿Cómo reducirías el tamaño del paquete JavaScript?

### Feature Expansions

- **Autenticación de usuario**: ¿Cómo integrarías con el sistema better-auth existente?
- **Actualizaciones en tiempo real**: ¿Cómo implementarías conteos de me gusta en vivo entre usuarios?
- **Páginas de detalle de configuración**: ¿Cómo crearías páginas individuales de configuración con más información?
- **Sistema de comentarios**: ¿Cómo agregarías funcionalidad de comentarios a las configuraciones?

### Production Readiness

- **Integración de base de datos**: ¿Cómo migrarías de datos ficticios a una base de datos real?
- **Subida de archivos**: ¿Cómo implementarías la subida de imágenes para nuevos envíos?
- **Limitación de velocidad**: ¿Cómo prevendrías envíos de spam?
- **Monitoreo y analíticas**: ¿Qué métricas rastrearías?

---

## 4. Challenges Faced & Lessons Learned

¿Cuál fue la parte más difícil de este desafío para ti? ¿Cómo la superaste? ¿Qué aprendiste en el camino?

Este es un gran lugar para hablar sobre:

- **Desafíos de integración tRPC**: ¿Algún problema con patrones de llamadas del lado del servidor o generación de tipos?
- **Next.js Server Actions**: ¿Desafíos con manejo de formularios, validación, o estados de error?
- **Complejidad de gestión de estado**: ¿Problemas gestionando estados de me gusta entre componentes?
- **Estilo y diseño responsivo**: ¿Desafíos creando un diseño atractivo y amigable para móviles?
- **Complejidades de TypeScript**: ¿Algún problema de inferencia de tipos o tipos genéricos complejos?

¡Valoramos la transparencia y una mentalidad de crecimiento! No tengas miedo de discutir lo que no funcionó inicialmente y cómo iteraste para encontrar una mejor solución.

---

## 5. Implementation Results & Quality Assessment

### Feature Completeness

- **Gallery Page**: Se obtiene y muestra exitosamente todos los setups en un formato de grid responsive.
- **Like Functionality**: Los botones de me gusta funcionan correctamente con gestión de estado apropiada utilizando `useState`, `useOptimistic` y un server action mock.
- **Submission Form**: Se maneja las validaciónes utilizando el schema **CreateSetupSchema** integrado al hook **useForm**, de tal forma que, al hacer submit, se valida el formulario antes de ser enviado al servidor, evitando que lleguen datos con el formato incorrecto al action **createSetup**.
- **Server-side Processing**: El Server Action **createSetup** fue implementado apropiadamente con validación Zod utilizando el schema **CreateSetupSchema**. En el caso del server action **likeSetup** no se le agregó validación Zod ya que es una función mock (y porque se me acabó el tiempo).

### Code Quality Metrics

- **Type Safety**: ¿Es la aplicación completamente segura en tipos desde API hasta componentes UI?
- **Component Reusability**: ¿Qué tan bien están estructurados los componentes para reutilización y mantenibilidad?
- **Error Handling**: ¿Qué tan elegantemente maneja la aplicación casos extremos y errores?
- **Performance**: ¿Hay cuellos de botella de rendimiento obvios u oportunidades de optimización?

### Advanced Challenge Implementation

Si intentaste alguno de los desafíos avanzados:

- **Optimistic UI**: ¿Qué tan fluida es la experiencia del usuario con actualizaciones optimistas?
- **Shared Validation**: Se reutiliza efectivamente el schema **CreateSetupSchema** tanto en el client como en el server, obteniendo así una consistencia fuerte entre la validación de lados.
- **Component Architecture**: Se implementó **Compound Components** en el componente [SetupSkeleton]("./apps/nextjs/src/app/_components/setup-gallery/SetupSkeleton.tsx"). Esta estructura será util para el punto de implementarse un **Load More Button** o un **Scroll Infinito**.

### Self-Assessment

- ¿Qué aspectos de tu implementación son de los que más te sientes orgulloso?
- ¿Qué refactorizarías si empezaras de nuevo?
- ¿Cómo equilibra tu solución la completitud de características con la calidad del código?
- ¿Qué priorizarías mejorar con más tiempo?
