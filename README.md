# Simple Banking API

![Version](https://img.shields.io/badge/version-0.0.9-blue)

API bancaria simple desarrollada con NestJS que proporciona funcionalidades para gestionar cuentas de usuario, realizar operaciones bancarias (depósitos y transferencias) y aplicar límites operativos (según tipo de usuario y de transacción).

## 📋 Contenido
- [Características](#características-principales)
- [Tecnologías](#tecnologías-utilizadas)
- [Instalación](#instalación)
- [Uso](#uso)
- [Documentación API](#documentación-api)
- [Tests](#tests)


## ✨ Características Principales

### 👤 Gestión de Usuarios
- Registro de usuarios con datos personales
- Autenticación segura mediante JWT
- Obtención de información de perfiles de usuario
- Usuarios con diferentes niveles que determinan sus límites operativos

### 💰 Operaciones Bancarias
- **Depósitos**: Permite a los usuarios ingresar dinero a sus cuentas
- **Transferencias**: Facilita el envío de dinero entre usuarios con descripción opcional
- **Historial de transacciones**: Consulta detallada de movimientos con filtrado por fecha y tipo

### 🛡️ Sistema de Límites
- Configuración de límites diarios y mensuales por tipo de operación
- Límites diferenciados según el nivel del usuario
- Sistema inteligente de bloqueo:
  - Permite operaciones dentro de los límites establecidos
  - Advierte al usuario cuando intenta exceder sus límites
  - Bloquea temporalmente después de múltiples intentos de exceder límites

### 🔒 Seguridad
- Contraseñas almacenadas con hash seguro (bcrypt)
- Protección de rutas mediante JWT
- Validación de datos en todas las operaciones
- Sistema anti-fraude mediante monitoreo de intentos de exceder límites

### 📝 Documentación
- API completamente documentada con Swagger
- Endpoints con descripción detallada de parámetros y respuestas
- Interfaz interactiva para probar la API

## 🛠️ Tecnologías Utilizadas
- **[NestJS](https://nestjs.com/)**: Framework de backend basado en Node.js
- **[TypeORM](https://typeorm.io/)**: ORM para manejo de la base de datos
- **[PostgreSQL](https://www.postgresql.org/)**: Base de datos relacional
- **[JWT](https://jwt.io/)**: Autenticación mediante tokens
- **[Class-validator](https://github.com/typestack/class-validator)**: Validación de datos
- **[Swagger](https://swagger.io/)**: Documentación interactiva de la API

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/simple-banking-project.git

# Instalar dependencias
cd simple-banking-project
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar la aplicación en modo desarrollo
npm run start:dev
```

## 📖 Uso

Una vez instalada, la API estará disponible en `http://localhost:3000`.

### Ejemplo de flujo básico:

1. Crear un usuario: `POST /users`
2. Iniciar sesión: `POST /auth/login`
3. Realizar un depósito: `POST /transactions/deposit`
4. Transferir dinero: `POST /transactions/transfer`
5. Ver historial: `GET /transactions`

## 📚 Documentación API

La documentación completa de la API está disponible en Swagger:

```
http://localhost:3000/api
```

Desde allí podrás explorar todos los endpoints, ver los formatos de solicitud y respuesta, y probar la API directamente desde el navegador.

## 🧪 Tests

El proyecto incluye una completa suite de tests unitarios y de integración para garantizar la calidad y robustez del código.

### Cobertura de Tests

- **Servicios**: Tests unitarios para todos los servicios principales (usuarios, autenticación, transacciones, límites)
- **Controladores**: Tests de integración para endpoints críticos
- **Validaciones**: Tests para reglas de negocio y validaciones

### Ejecutar los Tests

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests con cobertura
npm run test:cov
```