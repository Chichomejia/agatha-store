# Activar el registro seguro de pedidos

Los pedidos ahora se registran mediante el servidor. El servidor valida los productos, el precio y las existencias dentro de una transacción; el navegador ya no puede crear pedidos ni modificar el inventario directamente.

## Configuración requerida

1. En Google Cloud Console, crea una clave web basada en puntuación para **reCAPTCHA Enterprise / Fraud Defense** y autoriza el dominio del entorno donde se usará. Para desarrollo local puede ser una clave distinta que permita `localhost`; nunca agregues `localhost` a una clave de producción. No uses una clave con casilla de verificación.
2. En Firebase Console > **App Check**, elige **Fraud Defense** para la app web y registra la clave pública del sitio creada en Google Cloud. No elijas el proveedor reCAPTCHA clásico que aparece marcado como obsoleto.
3. Para desarrollo local, ve a Firebase Console > **Configuración del proyecto > Cuentas de servicio** y genera una clave privada JSON. Asígnale a esa cuenta el rol de IAM **Cloud Datastore User**. Guarda el archivo descargado fuera del repositorio y define su ruta en `.env.local` como `GOOGLE_APPLICATION_CREDENTIALS=C:/ruta/segura/clave-servicio.json`. El servidor también admite `FIREBASE_SERVICE_ACCOUNT_JSON` como secreto privado. En producción, prefiere las credenciales administradas del alojamiento o un secreto privado. Nunca agregues el JSON al repositorio ni lo compartas en mensajes.
4. Define `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` con la clave pública del sitio en el mismo entorno. Las variables de entorno requieren reiniciar el servidor local o volver a publicar el sitio.
5. Despliega la aplicación con el endpoint `/api/orders` disponible.
6. En Firestore > Reglas, publica el contenido actualizado de `firestore.rules`. Hazlo después de desplegar el endpoint para evitar interrumpir las compras.

La clave privada del servicio no debe tener el prefijo `NEXT_PUBLIC_`. La clave pública reCAPTCHA sí debe usarlo. El servidor requiere Node.js 22 o superior.

## Verificación después de configurar

- Crear un pedido con stock suficiente debe guardar pedido y descuento de inventario juntos.
- Intentar comprar más unidades que las disponibles debe rechazar el pedido sin cambiar el inventario.
- Cambiar un precio en el carrito antes de confirmar debe pedir actualizarlo.
- Un navegador sin token App Check válido no debe registrar pedidos.
- Las escrituras directas de pedidos y cambios de stock desde clientes quedan denegadas por las reglas; las funciones administrativas siguen autorizadas.
