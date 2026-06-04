# 🏠 Mi Agenda Personal - Sistema Cloud Inalámbrico v2.0

Aplicación Web Progresiva (PWA) optimizada para tablets y dispositivos Android, diseñada con alta legibilidad para el control centralizado de registros médicos, trámites legales y presupuestos familiares de infraestructura.

## 📂 Lista de Archivos Cargados en este Repositorio

Para que la aplicación funcione de manera correcta, este repositorio cuenta con los siguientes archivos estructurados de forma modular:

1. `index.html`: Panel de control visual con textos grandes y botones de alto contraste.
2. `modulo-google-auth.js`: Gestor de conexiones seguras OAuth 2.0 con Google Cloud Workspace.
3. `modulo-google-sheets.js`: Motor de sincronización asíncrona en caliente con las hojas de cálculo.
4. `modulo-google-drive.js`: Cargador multipart de archivos binarios y PDFs médicos.
5. `modulo-usuarios.js`: Módulo de registro de perfiles familiares expandible (Cédula, Correo, Emoji).
6. `modulo-instituciones.js`: Directorio maestro de entidades vinculadas (IPS, EPS, Entidades Públicas).
7. `modulo-citas.js`: Agendamiento médico con desglose de copago y transporte obligatorio.
8. `modulo-tramites.js`: Bitácora cronológica tipo ficha para trámites PQRS.
9. `modulo-documentos.js`: Motor de nomenclatura automatizada de archivos por fecha de emisión real.
10. `modulo-obras.js`: Gestor de costes de remodelación (Diferencia Materiales de Mano de Obra).
11. `modulo-finanzas.js`: Libro diario contable unificado con Popup de alerta contra cuentas inexistentes.
12. `modulo-ia.js`: Procesador de comandos libres por voz con interruptor de desactivación segura.

## 📊 Estructura del Libro Central de Google Sheets
Toda la aplicación escribe sus datos de forma relacional en un único archivo titulado **"Mi Agenda Personal"**, el cual debe poseer exactamente las siguientes 6 pestañas:
* **`Citas`**: Historial de agendas médicas y estados del servicio.
* **`Tramites`**: Líneas de tiempo de radicados de Colpensiones, SuperSalud o Empresas.
* **`Finanzas`**: Registro unificado de ingresos y egresos familiares.
* **`Documentos`**: Inventario de archivos enlazados con Drive por su fecha de expedición médica.
* **`Usuarios`**: Perfiles autorizados con su paleta de colores de identificación.
* **`Obras`**: Control discriminado de compras de insumos y pago de jornales a obreros.
