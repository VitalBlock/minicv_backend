Informe de Errores y Soluciones del Backend

Introducción

Este informe detalla los errores encontrados en el repositorio de backend de su proyecto MiniCV, así como las soluciones implementadas y las recomendaciones para futuras mejoras. El objetivo principal fue asegurar que el servicio pudiera iniciarse correctamente en el entorno de desarrollo.

Errores y Soluciones del Backend

Problema 1: Credenciales de MercadoPago Faltantes

Descripción: Al intentar iniciar el servidor backend por primera vez (npm start), se produjo un error relacionado con la falta de credenciales de autenticación para MercadoPago. El mensaje de error específico fue: Error: You must provide a method of authentication (client_id & client_secret or access_token).

Causa: El archivo server.js y el controlador mercadoPagoController.js intentan configurar la librería de MercadoPago al inicio, pero no encontraron las variables de entorno necesarias (MERCADO_PAGO_ACCESS_TOKEN y MERCADO_PAGO_PUBLIC_KEY) en el entorno de ejecución local. Aunque el proyecto utiliza dotenv para cargar variables de entorno, el archivo .env no existía en el directorio raíz del backend.

Solución Implementada:

1.
Se solicitó al usuario las variables de entorno configuradas en su despliegue de Render.

2.
Se creó un archivo .env en el directorio /home/ubuntu/minicv_backend con las variables proporcionadas por el usuario. Esto incluyó FRONTEND_URL, JWT_SECRET, MERCADO_PAGO_ACCESS_TOKEN, MERCADO_PAGO_PUBLIC_KEY, y las variables de conexión a la base de datos MySQL (aunque la conexión a la base de datos no fue el problema inicial, es crucial para el funcionamiento completo del backend).

Resultado: Después de crear el archivo .env, el error de credenciales de MercadoPago se resolvió, permitiendo que la configuración de la librería se realizara correctamente.

Problema 2: Puerto en Uso (EADDRINUSE)

Descripción: Tras resolver el problema de las credenciales de MercadoPago, al intentar iniciar el servidor backend nuevamente, se encontró un nuevo error: Error: listen EADDRINUSE: address already in use :::10000. Esto indica que el puerto 10000, que el backend intenta usar (según la variable de entorno PORT=10000), ya estaba siendo utilizado por otro proceso.

Causa: Este tipo de error suele ocurrir cuando una instancia anterior del servidor no se cerró correctamente o cuando otro proceso en el sistema está utilizando el mismo puerto. En un entorno de sandbox, esto puede suceder si un intento previo de iniciar el servidor no se detuvo completamente antes de un nuevo intento.

Solución Implementada:

1.
Se utilizó el comando fuser -k 10000/tcp para identificar y terminar el proceso que estaba ocupando el puerto 10000.

Resultado: Una vez que el puerto fue liberado, el servidor backend pudo iniciarse correctamente, mostrando el mensaje Modelos sincronizados con la base de datos y Servidor backend ejecutándose en el puerto 10000.

Aplicabilidad de las Soluciones en Producción

Es fundamental entender que las soluciones y los problemas identificados en este informe se abordaron principalmente desde la perspectiva de un entorno de desarrollo local o de sandbox. Si bien los principios subyacentes son los mismos, la implementación y la gestión en un entorno de producción difieren significativamente.

Backend (Node.js/Express)

Variables de Entorno:

•
Problema: La ausencia del archivo .env y la consecuente falta de credenciales de MercadoPago y configuración de la base de datos impidieron el inicio del servidor en el entorno de desarrollo.

•
En Producción: En un entorno de producción como Render, las variables de entorno se configuran directamente en la plataforma (por ejemplo, a través de la interfaz de usuario o la API de Render). El código de la aplicación accede a estas variables a través de process.env. La solución de crear un archivo .env es específica para el desarrollo local y no se aplica directamente a la producción, donde Render ya maneja la inyección de estas variables. Sin embargo, la correcta definición de estas variables en Render es crucial para que su aplicación funcione. Si alguna de las variables que me proporcionó no estuviera correctamente configurada en Render, su aplicación en producción también fallaría de manera similar.

Gestión de Puertos (EADDRINUSE):

•
Problema: El error EADDRINUSE ocurrió porque un proceso anterior no se cerró correctamente, dejando el puerto 10000 ocupado.

•
En Producción: En plataformas como Render, la gestión de puertos es manejada por el proveedor de la nube. Render asigna un puerto dinámico a su aplicación y enruta el tráfico hacia él. No es común encontrar un error EADDRINUSE en producción a menos que su aplicación intente escuchar en un puerto fijo que ya esté en uso por otro servicio dentro del mismo contenedor o instancia, lo cual es una mala práctica en entornos de PaaS (Platform as a Service). La solución de fuser -k es una herramienta de depuración y solución de problemas local y no se utiliza en entornos de producción. En producción, los orquestadores de contenedores o los sistemas de gestión de procesos se encargarían de asegurar que los servicios se inicien correctamente y que los puertos estén disponibles.

