# 🤝 Contribuir a CODESTORM

¡Gracias por tu interés en contribuir a CODESTORM! Este documento te guiará a través del proceso de contribución.

## 🎯 Cómo Contribuir

### 📋 Antes de Empezar

1. **Fork** el repositorio
2. **Clona** tu fork localmente
3. **Configura** el entorno de desarrollo
4. **Lee** la documentación técnica

### 🔧 Configuración del Entorno

```bash
# Clonar tu fork
git clone https://github.com/tu-usuario/codestorm.git
cd codestorm

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus claves API

# Verificar configuración
npm run verify
```

### 🚀 Proceso de Desarrollo

#### **1. Crear una Rama**
```bash
git checkout -b feature/nueva-funcionalidad
# o
git checkout -b fix/correccion-bug
```

#### **2. Realizar Cambios**
- Sigue las convenciones de código existentes
- Agrega comentarios explicativos
- Mantén los commits pequeños y enfocados

#### **3. Probar Cambios**
```bash
# Verificar que compile
npm run build

# Ejecutar linting
npm run lint

# Probar funcionalidad
npm run test:apis
```

#### **4. Commit y Push**
```bash
git add .
git commit -m "feat: agregar nueva funcionalidad X"
git push origin feature/nueva-funcionalidad
```

#### **5. Crear Pull Request**
- Describe claramente los cambios
- Incluye capturas de pantalla si es relevante
- Referencia issues relacionados

## 📝 Convenciones de Código

### **TypeScript/JavaScript**
- Usa TypeScript para nuevos archivos
- Sigue las reglas de ESLint configuradas
- Usa nombres descriptivos para variables y funciones
- Agrega tipos explícitos cuando sea necesario

### **React Components**
- Usa componentes funcionales con hooks
- Implementa PropTypes o interfaces TypeScript
- Mantén componentes pequeños y enfocados
- Usa Tailwind CSS para estilos

### **Commits**
Usa el formato de [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(scope): descripción

feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: cambios de formato
refactor: refactorización de código
test: agregar o modificar tests
chore: tareas de mantenimiento
```

## 🎯 Áreas de Contribución

### **🤖 Sistema de IA**
- Mejoras en prompts de agentes
- Optimización de parámetros
- Nuevos modelos de IA
- Algoritmos de distribución

### **🔧 Funcionalidades**
- Nuevos agentes especializados
- Herramientas de desarrollo
- Mejoras en la interfaz
- Optimizaciones de rendimiento

### **📚 Documentación**
- Guías de usuario
- Documentación técnica
- Ejemplos de uso
- Tutoriales

### **🧪 Testing**
- Tests unitarios
- Tests de integración
- Tests de rendimiento
- Validación de APIs

## 🐛 Reportar Bugs

### **Antes de Reportar**
1. Busca en issues existentes
2. Verifica que sea reproducible
3. Prueba con la última versión

### **Información a Incluir**
- **Descripción clara** del problema
- **Pasos para reproducir** el bug
- **Comportamiento esperado** vs actual
- **Entorno**: OS, Node.js, navegador
- **Logs de error** si están disponibles
- **Capturas de pantalla** si es relevante

### **Template de Bug Report**
```markdown
## 🐛 Descripción del Bug
[Descripción clara y concisa]

## 🔄 Pasos para Reproducir
1. Ir a '...'
2. Hacer clic en '...'
3. Ver error

## ✅ Comportamiento Esperado
[Qué debería pasar]

## ❌ Comportamiento Actual
[Qué está pasando]

## 🖥️ Entorno
- OS: [Windows/macOS/Linux]
- Node.js: [versión]
- Navegador: [Chrome/Firefox/Safari]
- CODESTORM: [versión]

## 📋 Información Adicional
[Logs, capturas, etc.]
```

## 💡 Solicitar Funcionalidades

### **Template de Feature Request**
```markdown
## 🚀 Funcionalidad Solicitada
[Descripción clara de la funcionalidad]

## 🎯 Problema que Resuelve
[Qué problema o necesidad aborda]

## 💭 Solución Propuesta
[Cómo debería funcionar]

## 🔄 Alternativas Consideradas
[Otras opciones evaluadas]

## 📊 Beneficios
[Por qué sería útil]
```

## 🔍 Proceso de Review

### **Criterios de Aceptación**
- ✅ Código limpio y bien documentado
- ✅ Tests pasan correctamente
- ✅ No rompe funcionalidad existente
- ✅ Sigue convenciones del proyecto
- ✅ Documentación actualizada si es necesario

### **Proceso de Review**
1. **Revisión automática** (CI/CD)
2. **Revisión de código** por maintainers
3. **Testing** en diferentes entornos
4. **Aprobación** y merge

## 🏆 Reconocimiento

Los contribuidores serán reconocidos en:
- Lista de contribuidores en README
- Releases notes
- Documentación del proyecto

## 📞 Contacto

- **Issues**: Para bugs y feature requests
- **Discussions**: Para preguntas generales
- **Email**: [contacto@botidinamix.ai]

## 📄 Licencia

Al contribuir, aceptas que tus contribuciones serán licenciadas bajo la misma licencia MIT del proyecto.

---

¡Gracias por ayudar a hacer CODESTORM aún mejor! 🚀
