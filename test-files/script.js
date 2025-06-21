function saludar() {
    alert('¡Hola! Este archivo JavaScript fue cargado desde un ZIP.');
    console.log('Función saludar() ejecutada correctamente');
}

// Función que se ejecuta cuando la página carga
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página cargada correctamente');
    console.log('Archivos extraídos del ZIP funcionando');
    
    // Agregar un efecto visual al botón
    const button = document.querySelector('button');
    if (button) {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }
});
