> **EL PORTAL SE MUDÓ.** Desde el 10 nov 2026 el portal vive en **https://regenerativo.co/portal/**,
> dentro del repo `regenerativo/regenerativo-web`, carpeta `portal/`. Todos los cambios se hacen allá.
> Este repo solo redirige portal.regenerativo.co → regenerativo.co/portal. No editar aquí.

# ESTADO DEL PORTAL DE ENCARGOS — regenerativo

Última actualización: 10 nov 2026. Este repo (rama `main`) es la versión vigente del portal.

## Dónde vive
- Web: https://portal.regenerativo.co (GitHub Pages, repo `regenerativo/reg-portal`, rama `main`, raíz).
- DNS en GoDaddy: CNAME `portal` → `regenerativo.github.io`.
- Base de datos y funciones: Supabase, proyecto `vevhopknufhfglfqribk`.
- Sitio estático sin compilación: `index.html`, `css/app.css`, `js/*.js`. Al cambiar CSS/JS, subir el `?v=` en `index.html`.

## Pendientes inmediatos
1. GitHub Pages: activar "Enforce HTTPS" cuando termine la verificación del DNS.
2. Supabase Auth: agregar `https://portal.regenerativo.co` a Site URL y Redirect URLs.
3. Redesplegar la función `onedrive-conexion` (el código del repo ya tiene PORTAL = `https://portal.regenerativo.co/`; la versión desplegada aún no).
4. Andrés crea el client secret en Entra y lo pega directo en Supabase como `MS_CLIENT_SECRET` (nunca en el chat).
5. Ajustes generales → Conectar OneDrive → probar Despegó.

## Reglas definidas por Andrés
- Código de encargo: `26  I  NOMBRE` (dos espacios, I, dos espacios, mayúsculas). `SCREG_xxxxx` es solo la cotización: aparece únicamente en la propuesta y en Propuestas preliminares.
- El cliente solo ve y descarga; nunca aprueba ni firma. Aprobar es solo del administrador (apardo@).
- Cliente: propuesta, contrato y adendas (el otrosí va dentro de contrato) = tarjeta "A continuación encuentras el documento de…" + descarga. Brief e informes = visibles + descarga. Presupuesto y Gantt = visibles, sin descarga. Nunca editables (Word/Excel).
- Un solo membrete regenerativo para todos los PDF: izquierda servicio en mayúscula bold + "Servicios" en gris; derecha TIPO _ ref y fecha debajo en gris; número de página abajo a la derecha en bold; pie "Por — regenerativo" + contacto.
- facturacion@ solo ve Finanzas; apardo@ ve todo.
- Gráfica igual a regenerativo.co y a la maqueta REG - BRAND WEB (barra superior: nombre del encargo a la izquierda sin bold, logo a la derecha; remate inferior solo con la línea final).
- Finanzas: gastos del correo entran "por confirmar" y Andrés los clasifica; el salario va aparte del balance.

## Pendientes de producto
- Cuentas de cobro como tipo de documento.
- Propuesta completa en PDF sobre la plantilla real SCREG.
- Subir contrato firmado y anexos.
- Finanzas: gestión de categorías, topes, vista de soportes para el contador.
