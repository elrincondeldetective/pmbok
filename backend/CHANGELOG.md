# Changelog

## [0.4.0](https://github.com/elrincondeldetective/pmbok/compare/pmbok-backend-0.3.0...pmbok-backend-0.4.0) (2026-01-11)


### Features

* **backend:** integrar django-prometheus para exportación de métricas ([18a28a7](https://github.com/elrincondeldetective/pmbok/commit/18a28a75938c5071774cae226d3e774ac716ec39))
* **backend:** registrar django-prometheus en las dependencias del proyecto ([881e212](https://github.com/elrincondeldetective/pmbok/commit/881e2122450e22d0a364a10df5c0fa9c07571301))


### Bug Fixes

* **backend:** corregir orden de middlewares de django-prometheus ([3b483b9](https://github.com/elrincondeldetective/pmbok/commit/3b483b9c14f077c33bf52b3c0b73b47336791a84))
* **backend:** eliminar declaración duplicada de django_prometheus ([b862cac](https://github.com/elrincondeldetective/pmbok/commit/b862cac68b1cf62b07890d1c20314a27e9f8485d))

## [0.3.0](https://github.com/elrincondeldetective/pmbok/compare/pmbok-backend-0.2.1...pmbok-backend-0.3.0) (2026-01-10)


### Features

* **auth:** configurar dominios de produccion y sanitizacion de URL en el cliente API ([5463215](https://github.com/elrincondeldetective/pmbok/commit/546321550fa918265e2afa18df31d6784a370cfd))

## [0.2.1](https://github.com/reydem/pmbok/compare/pmbok-backend-0.2.0...pmbok-backend-0.2.1) (2026-01-09)


### Bug Fixes

* **backend:** prueba final de integracion federada ([1c02633](https://github.com/reydem/pmbok/commit/1c02633baf120cad57e1c2c84efbd842ac56db68))

## [0.2.0](https://github.com/reydem/pmbok/compare/pmbok-backend-0.1.0...pmbok-backend-0.2.0) (2026-01-09)


### ⚠ BREAKING CHANGES

* **security:** Todos los endpoints de la API ahora requieren autenticación por defecto. Los clientes que accedían a recursos sin un token JWT válido comenzarán a recibir una respuesta `401 Unauthorized`.
* **api, ci:** El esquema de la base de datos ha cambiado en los modelos de personalización para incluir el campo `department`. Se requiere una migración de base de datos para aplicar este cambio.
* **build:** El Dockerfile específico del backend (`backend/Dockerfile`) ha sido eliminado. El proceso de construcción ahora debe ser iniciado desde la raíz del proyecto, utilizando un Dockerfile central.
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

* **api, ci:** implementa health check y personalización por departamento ([02c6f08](https://github.com/reydem/pmbok/commit/02c6f0854d96e5f9da6456f5619d6a80c905a48a))
* **api:** implementa el CRUD básico para el modelo Task ([7bc9d9d](https://github.com/reydem/pmbok/commit/7bc9d9d53b2bc0308fcd65a8ea1d206e8a0f01a4))
* **auth:** implementa la Autenticación de Dos Factores (2FA) simulada ([6cc463d](https://github.com/reydem/pmbok/commit/6cc463d9f9c7c8e221c7db7b3a5d780301d11589))
* **auth:** implementa la pantalla de inicio de sesión ([6829964](https://github.com/reydem/pmbok/commit/68299646d384a25d33df129d279a4e3b8a247f24))
* **auth:** implementa manejo robusto de sesiones y errores ([358d680](https://github.com/reydem/pmbok/commit/358d680e8c5e12b7cbca8424df87ad067e6648e3))
* **backend:** configurar automatización de tareas y entorno de pruebas ([36e0a94](https://github.com/reydem/pmbok/commit/36e0a9496b17e01a9e1e8aaecd9836c11849c9f7))
* **config:** Permite configurar STATIC_ROOT desde el entorno ([78ae69b](https://github.com/reydem/pmbok/commit/78ae69b227f338c3a010a0a53e3d3a032b29cc5c))
* **configuración:** estructura inicial del proyecto ([c2364e1](https://github.com/reydem/pmbok/commit/c2364e12584b58b2bc3c67b5896ec4e703dbf58c)), closes [#01](https://github.com/reydem/pmbok/issues/01)
* **cors:** agrega el subdominio de pmbok-6 a los orígenes permitidos ([9a71878](https://github.com/reydem/pmbok/commit/9a71878cd9a633453ff51562c296da27b6ff15f0))
* **cors:** configura el middleware y los orígenes permitidos ([43d6493](https://github.com/reydem/pmbok/commit/43d64937e2af80a687c160b818709babb5ba5b1e))
* **dashboard:** Añadir navegación flotante para secciones ([a3dd047](https://github.com/reydem/pmbok/commit/a3dd047e6c9947d53bebb17710a6c3f4fe28cb0c))
* **data-model:** introduce categorización por Etapas y renombra Estado a Estatus ([566da22](https://github.com/reydem/pmbok/commit/566da2206520264191e9329d04f0181fd8361c96))
* **departamentos:** Implementa departamentos jerárquicos y filtro en Kanban ([c96afdf](https://github.com/reydem/pmbok/commit/c96afdf1f41c90478f7936b13233df788eaab728))
* **deploy:** configura dominio personalizado y logging en producción ([3aaa0c5](https://github.com/reydem/pmbok/commit/3aaa0c513ab76b88383c84adbb95e66546f6ba46))
* **deploy:** Habilita el sembrado de datos y migraciones en el arranque ([cff6b1c](https://github.com/reydem/pmbok/commit/cff6b1c78d530cf318a07108344fcff7ca6114bc))
* **deploy:** Habilita y limpia los scripts de sembrado de datos ([6680b4b](https://github.com/reydem/pmbok/commit/6680b4b636201fc68c7ad83b289d0939cdfaee9c))
* **deployment:** Añadir lógica de seeding automático e idempotente ([eae2953](https://github.com/reydem/pmbok/commit/eae295327c3eea7d792f940a7fd3ddf3bba76e9d))
* **deploy:** permite CORS para AWS Amplify y limpia código ([ad032e4](https://github.com/reydem/pmbok/commit/ad032e4a0cc1f30c11bd6d502c3a73f71668aaf7))
* **dev:** añade control de seeding y corrige duplicidad en logs ([f54bd7e](https://github.com/reydem/pmbok/commit/f54bd7e650b33e41419396394bc3cfed583e2ff6))
* **devops:** Mejora la configuración multi-entorno y la experiencia de desarrollo ([13132fa](https://github.com/reydem/pmbok/commit/13132fa63d1e61af3e278bfe2ddfec0285a0ec0c))
* **django:** registra las aplicaciones en la configuración ([86c66bf](https://github.com/reydem/pmbok/commit/86c66bfb2133eba1e70783a5e04d7f3172027f90))
* **docker:** add containerization config and remove tracked certs ([2536593](https://github.com/reydem/pmbok/commit/2536593cdd866b61754df835727c8c430390031a))
* **docker:** configurar compose para desarrollo full-stack ([6cbbb78](https://github.com/reydem/pmbok/commit/6cbbb78663e00e4f27e0ed49567df7bf1391f142))
* **docker:** dockerizar la aplicación con Django y PostgreSQL ([e3bc545](https://github.com/reydem/pmbok/commit/e3bc545c87d331b6e6975d4c37e5158ea1be2275))
* **documents:** añadir campo de URL al crear documentos y versiones ([dce684c](https://github.com/reydem/pmbok/commit/dce684c0ec453a33b0eefaf0bcf69d8055474e0d))
* **documents:** implementar selección de versión activa ([ee222c4](https://github.com/reydem/pmbok/commit/ee222c494c12c0e2569490ffaf2516ed74f491d1))
* **documents:** implementar versionado y anidación de documentos ([c29deb3](https://github.com/reydem/pmbok/commit/c29deb3835673bdbed01c00281f6b929a9860c08))
* **documents:** refactorizar adición de ítems a un modal dedicado ([1d2d303](https://github.com/reydem/pmbok/commit/1d2d303aea47068d779da11b69f69ae370fa3cd4))
* **documents:** refactorizar lógica de borrado para promover versiones ([b55fa11](https://github.com/reydem/pmbok/commit/b55fa116265bd9b24cad20d25b14db2c0618d0f9))
* **dx:** añade endpoint de versión y script de reinicio local ([5f611ab](https://github.com/reydem/pmbok/commit/5f611ab3968a4c614587e465478b53b59d0ffeec))
* **i18n, gunicorn:** añade soporte i18n y auto-ajuste de workers ([06e85cb](https://github.com/reydem/pmbok/commit/06e85cbb0adc7ab7131620f4691b7ee73d3f3756))
* **kanban:** implementa tablero Kanban interactivo para procesos PMBOK ([1fdcc6e](https://github.com/reydem/pmbok/commit/1fdcc6ee80eb0cfe9d93901edab8aeabe3f1de40))
* **kanban:** implementar desasignación de procesos del tablero ([a642538](https://github.com/reydem/pmbok/commit/a642538b73ab7aa35a3d0593400b3a3d63688753))
* **kanban:** Implementar estado individual para personalizaciones ([2167213](https://github.com/reydem/pmbok/commit/216721367c3e1ed82fdaa171eecfa5614d928580))
* **kanban:** Integra procesos Scrum en el tablero Kanban y unifica el estado ([e754cb3](https://github.com/reydem/pmbok/commit/e754cb32faf0213deab29d1f5f6ff1eb97fe1cf7))
* **modal:** Habilitar la edición y guardado de ITTOs por país ([afd5014](https://github.com/reydem/pmbok/commit/afd50141605bea30e05a8e7578e750d39b5e78ad))
* **modal:** Permitir la visualización y gestión de personalizaciones ([56c2a54](https://github.com/reydem/pmbok/commit/56c2a54e9a1e19de47a795064405a902e72645b8))
* **modals:** Implementa la edición en línea para los ítems del proceso ([6a3bcdd](https://github.com/reydem/pmbok/commit/6a3bcdd9953aa34ae9b31fb0ef8506923ead4f21))
* **modals:** Implementa la eliminación de ítems con modal de confirmación ([7f3af61](https://github.com/reydem/pmbok/commit/7f3af616286c1933b909c6f2f6d455d456e0e965))
* **pmbok:** agrega y muestra los ITTOs completos de los procesos ([6b13c79](https://github.com/reydem/pmbok/commit/6b13c79281a42bdeef9a83e11e50cfbd64a9dd9f))
* **pmbok:** inicializar infraestructura del backend ([d7442f3](https://github.com/reydem/pmbok/commit/d7442f38fee04ebc731a66ad8ccaff2ed0e44591))
* **process:** implementa funcionalidad de asignación de país ([53adf0d](https://github.com/reydem/pmbok/commit/53adf0dd443e737b829d951b4a60289ee357cb21))
* **process:** Migra ITTOs a JSON y habilita la persistencia de datos ([92ff8dd](https://github.com/reydem/pmbok/commit/92ff8dd2dffd34e6166de6fa77fd034cc3ce9654))
* **scrum:** Habilita modales de detalle para procesos Scrum ([6c0907a](https://github.com/reydem/pmbok/commit/6c0907a62bc91868e45d57cbe7ebaaf02bd6cf5a))
* **scrum:** Implementa doble filtrado por Estatus de Flujo y Fase de Proceso ([d08b0f2](https://github.com/reydem/pmbok/commit/d08b0f26f31939e446c3e388fddb41e82b038950))
* **scrum:** Implementa el filtrado de procesos por fase ([3d5f0f5](https://github.com/reydem/pmbok/commit/3d5f0f5fa337cf2019ca5233f37521dd1b74acf8))
* **scrum:** implementa modelo y vista para procesos Scrum ([9f2e7d4](https://github.com/reydem/pmbok/commit/9f2e7d4adcce15c373472359c4be5daa70f8297c))
* **scrum:** integra la gestión de procesos Scrum en el admin de Django ([36e2301](https://github.com/reydem/pmbok/commit/36e2301747f416985df7b4a271e73c4130ec3294))
* **security:** endurece la configuración de seguridad para producción ([0c52e11](https://github.com/reydem/pmbok/commit/0c52e11fceadb79d4b9d6a8aa7dbf4c2f6c9303a))
* **security:** implementa autenticación por defecto y mejora diagnósticos ([97bb94a](https://github.com/reydem/pmbok/commit/97bb94a64bd38869dc0ce1757a0d4c7d1908c07b))
* **security:** refina la configuración CORS y mejora script de diagnóstico ([6f10b3f](https://github.com/reydem/pmbok/commit/6f10b3ffaed7188cd8d05138d5d90a6ee1a61c70))
* **settings:** Configura la aplicación para producción en AWS ([075b7ad](https://github.com/reydem/pmbok/commit/075b7ad3e2019d00b281fa1667299fed86127b44))
* **state:** implementa carga y sincronización de datos por país ([5c2d5dc](https://github.com/reydem/pmbok/commit/5c2d5dc6f4e0350fef0771e62f1ec40c4f8485b6))
* **state:** Implementa Context API y actualización de estado Kanban ([a582814](https://github.com/reydem/pmbok/commit/a582814595bf8d537d8d6a21aa16a29d74c53b0d))
* **state:** optimiza la actualización de personalizaciones y las muestra en el modal ([dd19a94](https://github.com/reydem/pmbok/commit/dd19a9491daae01b393fdfdbd3e7523c188e4746))
* **system:** implementar visualizador de historial Git full-stack ([10a7b75](https://github.com/reydem/pmbok/commit/10a7b756eb242e9d95fec84bbe4567ddca6610aa))
* **ui:** Añade insignias visuales para diferenciar procesos PMBOK y Scrum ([ac53145](https://github.com/reydem/pmbok/commit/ac53145fda91166d4e1e929b6d2f4835272a80e6))
* **workflow:** Bloquear edición de ITTOs en estado "En Progreso" ([a64f845](https://github.com/reydem/pmbok/commit/a64f8450fdd811d5637f3a79029c6f4818ffe70a))
* **workflow:** implementa activación de tareas en dos fases (Backlog y ToDo) ([c0d3ea2](https://github.com/reydem/pmbok/commit/c0d3ea21ae53e7c7f18aa1cfeafa58bf4a139fcb))
* **workflow:** implementa panel de control para flujo híbrido PMBOK-Scrum ([e896837](https://github.com/reydem/pmbok/commit/e89683734c2f815aaff62d9ffde73630a9fdab35))


### Bug Fixes

* **auth:** asegura el guardado de la contraseña en el registro ([a0e61ea](https://github.com/reydem/pmbok/commit/a0e61ea7c2dc7d20719c56bf99c218f04d7e0746))
* **aws:** Configurar Django para proxy de AWS Elastic Beanstalk ([39b1532](https://github.com/reydem/pmbok/commit/39b1532f9980b7834572327bd25a17d49b74d635))
* **backend:** corregir modo de empaquetado y variables de entorno por defecto ([ef61e17](https://github.com/reydem/pmbok/commit/ef61e17f72cd02115539c06ace0489ce13e0db98))
* **ci:** corrige el contexto de build en buildspec ([349ced5](https://github.com/reydem/pmbok/commit/349ced5d164142001971f8690610f4020c8b5361))
* **config:** Corrige coma extra en la lista ALLOWED_HOSTS ([26a3278](https://github.com/reydem/pmbok/commit/26a3278a48e35beaff499d0768c83311f47cb935))
* **config:** Corrige el health check de AWS y refactoriza settings ([4c987e7](https://github.com/reydem/pmbok/commit/4c987e73370317fcb8de1a27342f1ee32ddb1ce9))
* Correct STATIC_ROOT path for Elastic Beanstalk ([ba97fae](https://github.com/reydem/pmbok/commit/ba97fae17308fc940b839c8b5b27f2a0a57c8af5))
* **cors:** actualiza la URL de origen permitido para Amplify ([bece49b](https://github.com/reydem/pmbok/commit/bece49be0b3a16d94fe65aba3b7318349acb7c91))
* **db:** permite deshabilitar SSL en la conexión para desarrollo ([5124151](https://github.com/reydem/pmbok/commit/5124151f5b921a6df399879413c26c0737ac1d66))
* **deploy:** excluye health endpoints de la redirección SSL ([79b11da](https://github.com/reydem/pmbok/commit/79b11dae02bcd22d9f37b1c9a040627327c5b3a5))
* **deploy:** refuerza la configuración de seguridad y corrige scripts ([4db74d6](https://github.com/reydem/pmbok/commit/4db74d6262ca09f0033e164a7865d38f548affa6))
* **docker:** Agrega el comando CMD para iniciar Gunicorn ([fbab73a](https://github.com/reydem/pmbok/commit/fbab73a610293b97cf394a8c2b312d94d952df28))
* **documents:** corregir datos al editar versiones activas ([2232f53](https://github.com/reydem/pmbok/commit/2232f538a0a662cfc6a16b94ce10376b43d377fd))
* **documents:** guardar cambios en la versión correcta del documento ([05dac9a](https://github.com/reydem/pmbok/commit/05dac9a533aaaf9beea8366050ec510801fa230b))
* **frontend:** corrige la configuración de Tailwind CSS para aplicar estilos ([f828d26](https://github.com/reydem/pmbok/commit/f828d261dfa5877b2c3c92a9ff135f4ac2af5615))
* **modal:** Corregir la lógica de cambio de estado Kanban ([5086439](https://github.com/reydem/pmbok/commit/50864393bdadabb7f267199407b5bac359fb50ae))
* **modal:** independiza el país mostrado del filtro global ([7757c89](https://github.com/reydem/pmbok/commit/7757c89b2305e507ae050a9bbdecc6cebe9ad368))
* **modal:** Sincronizar bloqueo de edición de ITTOs ([5aa62f2](https://github.com/reydem/pmbok/commit/5aa62f23425eded7bf59cb955599d88bc4a72bbc))
* **seeds:** Elimina el acento en el script de sembrado de Scrum ([228d0f4](https://github.com/reydem/pmbok/commit/228d0f4c678d09aa228769c31b0756dc5954d4ed))
* **seeds:** Limpia emoji y comentarios en el seeder de PMBOK ([a300782](https://github.com/reydem/pmbok/commit/a300782f8c135bd763c1d0aa19305edba0781f3f))
* **settings:** Actualiza ALLOWED_HOSTS para Elastic Beanstalk ([ac374b9](https://github.com/reydem/pmbok/commit/ac374b9bb1a5e5678d9fbb3d869864408829c0fb))
* **ui:** implementa UI optimista en Kanban y corrige lógica de personalización ([dc5b6f3](https://github.com/reydem/pmbok/commit/dc5b6f3b0953bc81bc925e7ee78b45b062ac8cd0))


### Documentation

* **pmbok:** add initial backend documentation ([077d6c0](https://github.com/reydem/pmbok/commit/077d6c081784c0a09572288bc610a77dcb5f9b7e))


### Code Refactoring

* **api:** envía todas las personalizaciones al cliente para el filtrado local ([ba8fddc](https://github.com/reydem/pmbok/commit/ba8fddc66151575f1a0cb41d9b1edf4b6c9bc2ea))
* **build:** Centraliza la configuración de Docker en la raíz del proyecto ([aa0dd0d](https://github.com/reydem/pmbok/commit/aa0dd0d9f571c6c17a300a043c74271ccdfa5f4b))
* **customization:** rediseña el modelo de datos para personalización por país ([c80bd03](https://github.com/reydem/pmbok/commit/c80bd032b6139d592a8c18d709097e66f68871ac))
