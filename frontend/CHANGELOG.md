# Changelog

## [0.2.0](https://github.com/reydem/pmbok/compare/pmbok-frontend-0.1.0...pmbok-frontend-0.2.0) (2026-01-09)


### ⚠ BREAKING CHANGES

* **kanban:** Se ha eliminado el endpoint de API para actualizar el estado Kanban de un proceso individual (`/api/pmbok-processes/<id>/update-kanban-status/` y su equivalente en Scrum). La actualización de tarjetas ahora debe realizarse a través del nuevo endpoint a nivel de personalización: `/api/customizations/<id>/update-kanban-status/`.
* **api:** La estructura de la respuesta de la API para los procesos ha cambiado.
    - El campo `customization` (objeto singular) ha sido reemplazado por `customizations` (un array de objetos).
    - El backend ya no fusiona los datos de un país específico. El parámetro de consulta `?country` ha sido eliminado y ya no tiene efecto. Los clientes ahora son responsables de filtrar el array `customizations`.
* **customization:** Se rediseña por completo el sistema de personalización.
    - Se eliminan los endpoints `PATCH .../{id}/update-country/` y `PATCH .../{id}/update-ittos/`.
    - La creación/actualización de personalizaciones ahora se gestiona a través de un único endpoint `POST /api/customizations/`.
    - El campo `country_code` se ha eliminado de los serializadores de `PMBOKProcess` y `ScrumProcess`. Los datos personalizados ahora se anidan opcionalmente en un campo `customization`.
* **data-model:** El endpoint de la API `/api/pmbok-processes/` ha cambiado. El campo `state` en la respuesta ha sido renombrado a `status`. Además, se ha añadido un nuevo campo objeto llamado `stage`.

### Features

* **auth:** agrega pantalla de inicio de sesión ([2aeb75b](https://github.com/reydem/pmbok/commit/2aeb75be0f31223d1f36953b0cbb45c4041eaa24))
* **auth:** implementa la Autenticación de Dos Factores (2FA) simulada ([6cc463d](https://github.com/reydem/pmbok/commit/6cc463d9f9c7c8e221c7db7b3a5d780301d11589))
* **auth:** implementa la pantalla de inicio de sesión ([6829964](https://github.com/reydem/pmbok/commit/68299646d384a25d33df129d279a4e3b8a247f24))
* **auth:** implementa manejo robusto de sesiones y errores ([358d680](https://github.com/reydem/pmbok/commit/358d680e8c5e12b7cbca8424df87ad067e6648e3))
* **configuración:** estructura inicial del proyecto ([c2364e1](https://github.com/reydem/pmbok/commit/c2364e12584b58b2bc3c67b5896ec4e703dbf58c)), closes [#01](https://github.com/reydem/pmbok/issues/01)
* **dashboard:** Activa etapas creando personalizaciones por país ([042867d](https://github.com/reydem/pmbok/commit/042867da3146127d4765aae5ce2fc9ead2d556d2))
* **dashboard:** añade filtro combinado por estatus y área de conocimiento ([b0e3565](https://github.com/reydem/pmbok/commit/b0e3565043a5934c9328531bb2147a8ec6562fdc))
* **dashboard:** Añadir navegación flotante para secciones ([a3dd047](https://github.com/reydem/pmbok/commit/a3dd047e6c9947d53bebb17710a6c3f4fe28cb0c))
* **dashboard:** diferencia procesos por área y añade leyenda de colores ([c319454](https://github.com/reydem/pmbok/commit/c31945400fbc950b59d2d6668067cc81a7e43382))
* **dashboard:** implementa filtro de procesos por estatus ([5d528a9](https://github.com/reydem/pmbok/commit/5d528a9b3b742b94a27875680cbc65dcd2c4ed9d))
* **data-model:** introduce categorización por Etapas y renombra Estado a Estatus ([566da22](https://github.com/reydem/pmbok/commit/566da2206520264191e9329d04f0181fd8361c96))
* **departamentos:** Implementa departamentos jerárquicos y filtro en Kanban ([c96afdf](https://github.com/reydem/pmbok/commit/c96afdf1f41c90478f7936b13233df788eaab728))
* **deploy:** permite CORS para AWS Amplify y limpia código ([ad032e4](https://github.com/reydem/pmbok/commit/ad032e4a0cc1f30c11bd6d502c3a73f71668aaf7))
* **devops:** Mejora la configuración multi-entorno y la experiencia de desarrollo ([13132fa](https://github.com/reydem/pmbok/commit/13132fa63d1e61af3e278bfe2ddfec0285a0ec0c))
* **docker:** add containerization config and remove tracked certs ([2536593](https://github.com/reydem/pmbok/commit/2536593cdd866b61754df835727c8c430390031a))
* **docker:** configurar compose para desarrollo full-stack ([6cbbb78](https://github.com/reydem/pmbok/commit/6cbbb78663e00e4f27e0ed49567df7bf1391f142))
* **documents:** añadir campo de URL al crear documentos y versiones ([dce684c](https://github.com/reydem/pmbok/commit/dce684c0ec453a33b0eefaf0bcf69d8055474e0d))
* **documents:** implementar selección de versión activa ([ee222c4](https://github.com/reydem/pmbok/commit/ee222c494c12c0e2569490ffaf2516ed74f491d1))
* **documents:** implementar versionado y anidación de documentos ([c29deb3](https://github.com/reydem/pmbok/commit/c29deb3835673bdbed01c00281f6b929a9860c08))
* **documents:** refactorizar adición de ítems a un modal dedicado ([1d2d303](https://github.com/reydem/pmbok/commit/1d2d303aea47068d779da11b69f69ae370fa3cd4))
* **documents:** refactorizar lógica de borrado para promover versiones ([b55fa11](https://github.com/reydem/pmbok/commit/b55fa116265bd9b24cad20d25b14db2c0618d0f9))
* **frontend:** configurar orquestación de tareas de desarrollo ([91f9960](https://github.com/reydem/pmbok/commit/91f996044e5ea77cc35876822dbcb8a9b07d3f28))
* **frontend:** inicializar aplicación React con Vite ([dbc7f3a](https://github.com/reydem/pmbok/commit/dbc7f3ade45c4efd55dfb7a08d31b72cd6aabafe))
* **frontend:** integrar Tailwind CSS y crear componente de Login ([179d675](https://github.com/reydem/pmbok/commit/179d67565827b3f356e7a4b7e7312eda5bb2c958))
* **kanban:** implementa tablero Kanban interactivo para procesos PMBOK ([1fdcc6e](https://github.com/reydem/pmbok/commit/1fdcc6ee80eb0cfe9d93901edab8aeabe3f1de40))
* **kanban:** implementar desasignación de procesos del tablero ([a642538](https://github.com/reydem/pmbok/commit/a642538b73ab7aa35a3d0593400b3a3d63688753))
* **kanban:** Implementar estado individual para personalizaciones ([2167213](https://github.com/reydem/pmbok/commit/216721367c3e1ed82fdaa171eecfa5614d928580))
* **kanban:** Integra procesos Scrum en el tablero Kanban y unifica el estado ([e754cb3](https://github.com/reydem/pmbok/commit/e754cb32faf0213deab29d1f5f6ff1eb97fe1cf7))
* **modal:** añade botón para agregar nuevos ITTOs directamente en la lista ([4970943](https://github.com/reydem/pmbok/commit/4970943b9521e433a6b110acf25dd08b3c0fca47))
* **modal:** Habilitar la edición y guardado de ITTOs por país ([afd5014](https://github.com/reydem/pmbok/commit/afd50141605bea30e05a8e7578e750d39b5e78ad))
* **modal:** Permitir la visualización y gestión de personalizaciones ([56c2a54](https://github.com/reydem/pmbok/commit/56c2a54e9a1e19de47a795064405a902e72645b8))
* **modals:** Implementa la adición de nuevos ítems de proceso ([048338c](https://github.com/reydem/pmbok/commit/048338ca469790f9fdf208293395f479ba66a79c))
* **modals:** Implementa la edición en línea para los ítems del proceso ([6a3bcdd](https://github.com/reydem/pmbok/commit/6a3bcdd9953aa34ae9b31fb0ef8506923ead4f21))
* **modals:** Implementa la eliminación de ítems con modal de confirmación ([7f3af61](https://github.com/reydem/pmbok/commit/7f3af616286c1933b909c6f2f6d455d456e0e965))
* **modals:** Rediseña la interfaz de los detalles del proceso con iconos e interactividad ([e65ad73](https://github.com/reydem/pmbok/commit/e65ad735d4e020fe51603e5a5494223315a0c272))
* **pmbok:** agrega y muestra los ITTOs completos de los procesos ([6b13c79](https://github.com/reydem/pmbok/commit/6b13c79281a42bdeef9a83e11e50cfbd64a9dd9f))
* **process:** implementa funcionalidad de asignación de país ([53adf0d](https://github.com/reydem/pmbok/commit/53adf0dd443e737b829d951b4a60289ee357cb21))
* **process:** Migra ITTOs a JSON y habilita la persistencia de datos ([92ff8dd](https://github.com/reydem/pmbok/commit/92ff8dd2dffd34e6166de6fa77fd034cc3ce9654))
* **scrum:** Habilita modales de detalle para procesos Scrum ([6c0907a](https://github.com/reydem/pmbok/commit/6c0907a62bc91868e45d57cbe7ebaaf02bd6cf5a))
* **scrum:** Implementa doble filtrado por Estatus de Flujo y Fase de Proceso ([d08b0f2](https://github.com/reydem/pmbok/commit/d08b0f26f31939e446c3e388fddb41e82b038950))
* **scrum:** Implementa el filtrado de procesos por fase ([3d5f0f5](https://github.com/reydem/pmbok/commit/3d5f0f5fa337cf2019ca5233f37521dd1b74acf8))
* **scrum:** implementa modelo y vista para procesos Scrum ([9f2e7d4](https://github.com/reydem/pmbok/commit/9f2e7d4adcce15c373472359c4be5daa70f8297c))
* **scrum:** integra la gestión de procesos Scrum en el admin de Django ([36e2301](https://github.com/reydem/pmbok/commit/36e2301747f416985df7b4a271e73c4130ec3294))
* **state:** implementa carga y sincronización de datos por país ([5c2d5dc](https://github.com/reydem/pmbok/commit/5c2d5dc6f4e0350fef0771e62f1ec40c4f8485b6))
* **state:** Implementa Context API y actualización de estado Kanban ([a582814](https://github.com/reydem/pmbok/commit/a582814595bf8d537d8d6a21aa16a29d74c53b0d))
* **state:** optimiza la actualización de personalizaciones y las muestra en el modal ([dd19a94](https://github.com/reydem/pmbok/commit/dd19a9491daae01b393fdfdbd3e7523c188e4746))
* **system:** implementar visualizador de historial Git full-stack ([10a7b75](https://github.com/reydem/pmbok/commit/10a7b756eb242e9d95fec84bbe4567ddca6610aa))
* **ui:** Añade insignias visuales para diferenciar procesos PMBOK y Scrum ([ac53145](https://github.com/reydem/pmbok/commit/ac53145fda91166d4e1e929b6d2f4835272a80e6))
* **ui:** muestra badges de países en la tarjeta de proceso ([6d39b38](https://github.com/reydem/pmbok/commit/6d39b3804dbe3092b9b768eccf16424f54a6f4d8))
* **workflow:** Bloquear edición de ITTOs en estado "En Progreso" ([a64f845](https://github.com/reydem/pmbok/commit/a64f8450fdd811d5637f3a79029c6f4818ffe70a))
* **workflow:** implementa activación de tareas en dos fases (Backlog y ToDo) ([c0d3ea2](https://github.com/reydem/pmbok/commit/c0d3ea21ae53e7c7f18aa1cfeafa58bf4a139fcb))
* **workflow:** implementa panel de control para flujo híbrido PMBOK-Scrum ([e896837](https://github.com/reydem/pmbok/commit/e89683734c2f815aaff62d9ffde73630a9fdab35))


### Bug Fixes

* **amplify:** correct monorepo build spec for frontend app ([30af2df](https://github.com/reydem/pmbok/commit/30af2df7b310287c127051fc3a71e536999cbc22))
* **amplify:** update build spec for monorepo structure ([607cc0a](https://github.com/reydem/pmbok/commit/607cc0a342fdea5f2f4eb4856597458f3582f1f2))
* **auth:** robustecer la lógica de refresco de token JWT ([2756d47](https://github.com/reydem/pmbok/commit/2756d4776e333ca7983fdda897e2daab163d6a0b))
* **context:** corrige la carga de datos en cambios de ruta y sin autenticación ([3b3a9ce](https://github.com/reydem/pmbok/commit/3b3a9ce01d829410dbef96870604ee94337ea2aa))
* **documents:** corregir datos al editar versiones activas ([2232f53](https://github.com/reydem/pmbok/commit/2232f538a0a662cfc6a16b94ce10376b43d377fd))
* **documents:** guardar cambios en la versión correcta del documento ([05dac9a](https://github.com/reydem/pmbok/commit/05dac9a533aaaf9beea8366050ec510801fa230b))
* **frontend:** corrige la configuración de Tailwind CSS para aplicar estilos ([f828d26](https://github.com/reydem/pmbok/commit/f828d261dfa5877b2c3c92a9ff135f4ac2af5615))
* **frontend:** flexibilizar reglas de linter y configuración de typescript ([256c974](https://github.com/reydem/pmbok/commit/256c974a4f04edaf922c39e68ecba6d31bf13186))
* **modal:** Corregir la lógica de cambio de estado Kanban ([5086439](https://github.com/reydem/pmbok/commit/50864393bdadabb7f267199407b5bac359fb50ae))
* **modal:** independiza el país mostrado del filtro global ([7757c89](https://github.com/reydem/pmbok/commit/7757c89b2305e507ae050a9bbdecc6cebe9ad368))
* **modal:** Sincronizar bloqueo de edición de ITTOs ([5aa62f2](https://github.com/reydem/pmbok/commit/5aa62f23425eded7bf59cb955599d88bc4a72bbc))
* Refactoriza configuración de despliegue y elimina emojis de la UI ([69eb7a5](https://github.com/reydem/pmbok/commit/69eb7a51e05c02b3adf88a54bf06dc09e4360d12))
* **ui:** corrige el estilo del modal y el espaciado de las tarjetas ([4f5bec8](https://github.com/reydem/pmbok/commit/4f5bec839e393b79fc3b745756c6e6ada8ba7486))
* **ui:** implementa UI optimista en Kanban y corrige lógica de personalización ([dc5b6f3](https://github.com/reydem/pmbok/commit/dc5b6f3b0953bc81bc925e7ee78b45b062ac8cd0))


### Code Refactoring

* **api:** envía todas las personalizaciones al cliente para el filtrado local ([ba8fddc](https://github.com/reydem/pmbok/commit/ba8fddc66151575f1a0cb41d9b1edf4b6c9bc2ea))
* **customization:** rediseña el modelo de datos para personalización por país ([c80bd03](https://github.com/reydem/pmbok/commit/c80bd032b6139d592a8c18d709097e66f68871ac))
