<script>
// Versión lista para copiar y pegar sin prefijos de diff
/* ==========================================
   BLOQUEAR Y DESBLOQUEAR BOTÓN GUARDAR
   ========================================== */
$(document).ready(function () {
    const btnGuardar = $('#btn-guardar-sugerencia');

    // Desbloquear al abrir el modal
    $('#sug_formula_m').on('shown.bs.modal', function () {
        btnGuardar.prop('disabled', false);
    });

    // Al hacer clic en el botón, generar el PDF y luego bloquearlo
    btnGuardar.on('click', function () {
        // Bloquear inmediatamente
        btnGuardar.prop('disabled', true);

        // Monitorear aparición del PDF (SweetAlert con iframe)
        const observer = new MutationObserver(() => {
            if ($('#swal2-html-container iframe').length > 0) {
                btnGuardar.prop('disabled', true);
                observer.disconnect(); // Detiene la observación
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });

    // Bloquear también al cerrar el modal
    $('#sug_formula_m').on('hidden.bs.modal', function () {
        btnGuardar.prop('disabled', true);
    });
});

/* ==========================================
   IMPRIMIR DOCUMENTO EN PDF
   ========================================== */

// Función principal para inicializar el visor PDF
function initPdfViewer() {
    const pdfViewer = {
        /* ==========================================
           GENERAR DOCUMENTO PROFESIONAL
           ========================================== */
        generarDocumentoProfesional: function() {
            const { jsPDF } = window.jspdf;

            // CONFIGURACIÓN CON MÁRGENES MÍNIMOS PARA MÁXIMO ANCHO
            const marginLeft = 15;
            const marginRight = 15;
            const marginTop = 13;
            const marginBottom = 10;
            const pageWidth = 216;
            const pageHeight = 279.4;
            
            const contentWidth = (pageWidth - marginLeft - marginRight) - 3; // -mm en total el ancho del texto 
            const contentHeight = pageHeight - marginTop - marginBottom;
            const bottomLimit = marginTop + contentHeight;

            const headerRowHeight = 6;
            const totalHeaderHeight = headerRowHeight * 3;
            const topMarginPrimera = totalHeaderHeight + 4;
            const topMarginOtras = totalHeaderHeight + 4;

            const doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'letter',
                filters: [],
                hotfixes: ['px_scaling'],
                precision: 100
            });

            // Ajusta este factor si deseas más o menos espacio entre renglones de las observaciones.
            // Debe coincidir con el resto del documento para mantener el mismo alto de línea.
            const LINE_HEIGHT_FACTOR_OBS = 1.15;

            const medirPalabraEstilizada = (palabra, estilos = {}) => {
                const fuenteAnterior = doc.getFont();
                const sizeAnterior = doc.getFontSize();

                let estilo = 'normal';
                if (estilos.bold && estilos.italic) estilo = 'bolditalic';
                else if (estilos.bold) estilo = 'bold';
                else if (estilos.italic) estilo = 'italic';

                doc.setFont('helvetica', estilo);
                doc.setFontSize(10.5);
                const ancho = doc.getTextWidth(palabra);

                doc.setFont(fuenteAnterior.fontName, fuenteAnterior.fontStyle);
                doc.setFontSize(sizeAnterior);
                return ancho;
            };

            const calcularAnchoEstilizado = (segmentos) => {
                const espacio = doc.getTextWidth(' ');
                return segmentos.reduce((acc, seg, idx) => {
                    const anchoSeg = medirPalabraEstilizada(seg.texto, seg);
                    return acc + anchoSeg + (idx < segmentos.length - 1 ? espacio : 0);
                }, 0);
            };

            const obtenerAltoLinea = () => {
                return (doc.getFontSize() * LINE_HEIGHT_FACTOR_OBS) / doc.internal.scaleFactor;
            };

            /* ==========================================
               FUNCIONES AUXILIARES
               ========================================== */
            const addHeader = (doc, pageNumber, totalPages) => {
                doc.setFontSize(8);
                const headerCol1 = marginLeft;
                const headerCol2 = marginLeft + 35;
                const headerCol3 = marginLeft + 130;
                const headerRowH = headerRowHeight;
                const centerColWidth = headerCol3 - headerCol2;
                const totalHeaderH = totalHeaderHeight;

                doc.rect(marginLeft, marginTop, contentWidth, totalHeaderH);
                doc.line(headerCol2, marginTop, headerCol2, marginTop + totalHeaderH);
                doc.line(headerCol3, marginTop, headerCol3, marginTop + totalHeaderH);
                doc.line(headerCol2, marginTop + headerRowH, marginLeft + contentWidth, marginTop + headerRowH);
                doc.line(headerCol2, marginTop + headerRowH * 2, marginLeft + contentWidth, marginTop + headerRowH * 2);

                const logoImg = 'img/logo_ortope_form.png';
                const logoWidth = 35;
                const logoHeight = 17;
                const logoVerticalCenter = marginTop + (totalHeaderH - logoHeight) / 2;
                try {
                    doc.addImage(logoImg, 'PNG', headerCol1 + 0.2, logoVerticalCenter, logoWidth, logoHeight);
                } catch (e) {
                    console.warn('No se pudo cargar logo:', e);
                }

                doc.text('PROCESO: GESTIÓN DE PRODUCCIÓN Y ADAPTACIÓN', 
                        headerCol2 + centerColWidth/2, marginTop + 4, { align: 'center' });
                doc.text('CÓDIGO: GPADO-AU-FA-003', headerCol3 + 2, marginTop + 4);
                doc.text('AREA: ATENCIÓN AL USUARIO', 
                        headerCol2 + centerColWidth/2, marginTop + headerRowH + 4, { align: 'center' });
                doc.text('VERSION: 001', headerCol3 + 2, marginTop + headerRowH + 4);
                doc.text('DOCUMENTO ASOCIADO: SUGERENCIAS FORMULA MEDICA', 
                        headerCol2 + centerColWidth/2, marginTop + headerRowH * 2 + 4, { align: 'center' });

                doc.setFontSize(7);
                doc.text(`PÁGINA ${pageNumber}`, marginLeft + 130 + 2, marginTop + headerRowH * 2 + 4);
            };

            /* ==========================================
               VARIABLES INICIALES Y ENCABEZADO
               ========================================== */
            let currentY = marginTop;
            let pageNumber = 1;
            let totalPages = 1;

            addHeader(doc, pageNumber, totalPages);
            currentY = marginTop + totalHeaderHeight + 4;

            /* ==========================================
               DATOS DEL FORMULARIO
               ========================================== */
            const datos = window.datosParaPDF || {};
            const tipoDoc = datos.tipo_doc || $('#sug_tipo_doc').val() || 'N/A';
            const documento = datos.doc || $('#sug_documento').val() || 'N/A';
            const datosPaciente = JSON.parse(localStorage.getItem('datosPaciente') || {});
            const paciente = datosPaciente.nombre || 'Nombre no disponible';
            const genero = datos.genero || $('#sug_genero').val() || 'N/A';
            const edad = datos.edad || $('#sug_edad').val() || 'N/A';
            const convenio = datos.convenio || $('#sug_convenio').val() || 'N/A';

            let observacionesHTML = $('#sug_observaciones').html()?.trim() || window.datosParaPDF.observacionesPDF || 'No se registraron observaciones';

            /* ==========================================
               FORMATEO DE FECHAS
               ========================================== */
            const formatearFecha = (fecha) => {
                try {
                    return new Date(fecha).toLocaleString('es-CO', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                } catch (e) {
                    return new Date().toLocaleString('es-CO', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                }
            };
            const fechaHora = datos.creacion ? formatearFecha(datos.creacion) : formatearFecha(new Date());

            /* ==========================================
               TABLA DE INFORMACIÓN DEL USUARIO
               ========================================== */
            const infoRowHeight = 6;
            const infoTableHeight = 18;
            const paddingLeft = 1;

            doc.rect(marginLeft, currentY, contentWidth, infoTableHeight);

            const col1Width = contentWidth * 0.52;
            const col1End = marginLeft + col1Width;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');

            doc.text('Fecha/hora: ' + fechaHora, marginLeft + paddingLeft, currentY + 4);
            const idParaPDF = window.idActualPDF || 'Cargando...';
            doc.text('Consecutivo: N° ' + idParaPDF, col1End + paddingLeft, currentY + 4);
            doc.line(col1End, currentY, col1End, currentY + infoRowHeight);
            doc.line(marginLeft, currentY + infoRowHeight, marginLeft + contentWidth, currentY + infoRowHeight);

            doc.text('Paciente: ' + paciente, marginLeft + paddingLeft, currentY + infoRowHeight + 4);
            doc.text(`ID: ${tipoDoc} ${documento}`, col1End + paddingLeft, currentY + infoRowHeight + 4);
            doc.line(col1End, currentY + infoRowHeight, col1End, currentY + infoRowHeight * 2);
            doc.line(marginLeft, currentY + infoRowHeight * 2, marginLeft + contentWidth, currentY + infoRowHeight * 2);

            const columnWidth = contentWidth / 3;
            const line1Pos = marginLeft + columnWidth;
            const line2Pos = marginLeft + (columnWidth * 2);
            doc.text('Edad: ' + edad, marginLeft + paddingLeft, currentY + infoRowHeight * 2 + 4);
            doc.text('Género: ' + genero, line1Pos + paddingLeft, currentY + infoRowHeight * 2 + 4);
            doc.text('Convenio: ' + convenio, line2Pos + paddingLeft, currentY + infoRowHeight * 2 + 4);
            doc.line(line1Pos, currentY + infoRowHeight * 2, line1Pos, currentY + infoRowHeight * 3);
            doc.line(line2Pos, currentY + infoRowHeight * 2, line2Pos, currentY + infoRowHeight * 3);

            currentY += infoTableHeight + 6;

            /* ==========================================
               CONTENIDO PRINCIPAL - MEJOR JUSTIFICADO
               ========================================== */
            doc.setFont('helvetica', 'bold');
            doc.text('Apreciado Profesional', marginLeft, currentY);
            currentY += 5;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);
            
            const textoIntro = "De la manera más respetuosa y en mi calidad de Técnico Ortoprotesista, me permito solicitar formalmente información adicional respecto a la formulación del dispositivo que requiere el usuario en mención ya que al verificar la prescripción médica y valorar al usuario, se puedo evidenciar que:";
            
            if (currentY + 25 > bottomLimit) {
                doc.addPage();
                pageNumber++;
                totalPages++;
                currentY = marginTop + topMarginOtras;
                addHeader(doc, pageNumber, totalPages);
            }
            
            // Texto introductorio con justificado mejorado
            doc.text(textoIntro, marginLeft, currentY, {
                maxWidth: contentWidth - 1, // -3mm reduce contenido 3mm
                align: 'justify',
                lineHeightFactor: 1.15
            });
            
            currentY += 18; // Un poco más de espacio después del párrafo

            /* ==========================================
               BLOQUE OBSERVACIONES - CON JUSTIFICADO PERFECTO
               ========================================== */

            // Helpers heredados del código de alineado profesional
            function normalizarAlineacion(align) {
                if (!align) return 'left';
                if (align === 'start') return 'left';
                if (align === 'end') return 'right';
                return align; // left, center, right, justify
            }

            function procesarHTMLParaPDFObservaciones(html) {
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const bloquesBase = [];

                function agregarBloque(texto, alineacion = 'left', tipo = 'texto', estilos = {}, sangria = 0, viñeta = '', opciones = {}) {
                    const { forceNuevo = false } = opciones;
                    if (tipo === 'salto' && bloquesBase.length && bloquesBase[bloquesBase.length - 1].tipo === 'salto') return;

                    // Combinar texto inline dentro del mismo bloque para evitar saltos de línea indeseados
                    const ultimo = bloquesBase[bloquesBase.length - 1];
                    const puedeCombinar =
                        tipo === 'texto' &&
                        ultimo &&
                        ultimo.tipo === 'texto' &&
                        !ultimo.esLista &&
                        ultimo.alineacion === alineacion &&
                        ultimo.sangria === sangria &&
                        !forceNuevo;

                    if (puedeCombinar) {
                        ultimo.segmentos.push({ texto, ...estilos });
                        ultimo.rawText += (ultimo.rawText ? ' ' : '') + texto;
                        return;
                    }

                    bloquesBase.push({
                        texto,
                        alineacion,
                        tipo,
                        estilos,
                        sangria,
                        viñeta,
                        segmentos: [{ texto, ...estilos }],
                        rawText: texto,
                        esLista: tipo === 'viñeta' || tipo === 'numerada'
                    });
                }

                function procesarNodo(nodo, alineacionPadre = 'left', estilosPadre = { bold: false, italic: false, underline: false }, sangria = 0) {
                    const tagName = nodo.tagName ? nodo.tagName.toLowerCase() : '';
                    const estilos = { ...estilosPadre };

                    if (tagName === 'b' || tagName === 'strong') estilos.bold = true;
                    if (tagName === 'i' || tagName === 'em') estilos.italic = true;
                    if (tagName === 'u') estilos.underline = true;

                    if (nodo.nodeType === Node.TEXT_NODE) {
                        const lineas = (nodo.textContent || '').split(/\r?\n/);
                        lineas.forEach((linea, idx) => {
                            if (idx > 0) agregarBloque('', 'left', 'salto', {}, sangria, '', { forceNuevo: true });

                            const textoTrim = linea.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
                            const fuerzaCorte = idx > 0; // sólo forzamos bloque nuevo cuando proviene de un salto real
                            if (textoTrim !== '') agregarBloque(textoTrim, alineacionPadre, 'texto', { ...estilos }, sangria, '', { forceNuevo: fuerzaCorte });
                            else agregarBloque('', 'left', 'salto', {}, sangria, '', { forceNuevo: true });
                        });
                        return;
                    }

                    if (tagName === 'br') {
                        agregarBloque('', 'left', 'salto', {}, sangria);
                        return;
                    }

                    if (tagName === 'p' || tagName === 'div') {
                        if (bloquesBase.length) agregarBloque('', 'left', 'salto', {}, sangria, '', { forceNuevo: true });
                        let alineacionActual = alineacionPadre;
                        if (nodo.style && nodo.style.textAlign) alineacionActual = nodo.style.textAlign;
                        else {
                            try {
                                const cs = window.getComputedStyle && window.getComputedStyle(nodo);
                                if (cs && cs.textAlign) alineacionActual = cs.textAlign;
                            } catch (e) {}
                        }
                        alineacionActual = normalizarAlineacion(alineacionActual);

                        if (!bloquesBase.length || bloquesBase[bloquesBase.length - 1].tipo !== 'salto') {
                            agregarBloque('', 'left', 'salto', {}, sangria, '', { forceNuevo: true });
                        }
                        Array.from(nodo.childNodes).forEach(hijo => procesarNodo(hijo, alineacionActual, estilos, sangria));
                        agregarBloque('', 'left', 'salto', {}, sangria, '', { forceNuevo: true });
                        return;
                    }

                    // Elementos que visualmente son de bloque (por display) aunque sean spans/otros
                    let displayValor = '';
                    try {
                        const cs = window.getComputedStyle && window.getComputedStyle(nodo);
                        if (cs && cs.display) displayValor = cs.display;
                    } catch (e) {}
                    const esDisplayBloque = displayValor && !['inline', 'inline-block', 'contents'].includes(displayValor);
                    if (esDisplayBloque) {
                        if (bloquesBase.length) agregarBloque('', 'left', 'salto', {}, sangria, '', { forceNuevo: true });
                        let alineacionActual = alineacionPadre;
                        if (nodo.style && nodo.style.textAlign) alineacionActual = nodo.style.textAlign;
                        else {
                            try {
                                const cs = window.getComputedStyle && window.getComputedStyle(nodo);
                                if (cs && cs.textAlign) alineacionActual = cs.textAlign;
                            } catch (e) {}
                        }
                        alineacionActual = normalizarAlineacion(alineacionActual);

                        if (!bloquesBase.length || bloquesBase[bloquesBase.length - 1].tipo !== 'salto') {
                            agregarBloque('', 'left', 'salto', {}, sangria, '', { forceNuevo: true });
                        }
                        Array.from(nodo.childNodes).forEach(hijo => procesarNodo(hijo, alineacionActual, estilos, sangria));
                        agregarBloque('', 'left', 'salto', {}, sangria, '', { forceNuevo: true });
                        return;
                    }

                    if (tagName === 'ul' || tagName === 'ol') {
                        const nuevoSangria = sangria + 4;
                        let contador = 1;

                        Array.from(nodo.children).forEach((li) => {
                            if (li.tagName.toLowerCase() !== 'li') return;

                            let prefijo = '';
                            if (tagName === 'ul') prefijo = '• ';
                            else if (tagName === 'ol') prefijo = contador + '. ';

                            let textoLi = '';
                            Array.from(li.childNodes).forEach(child => {
                                const childTag = child.tagName ? child.tagName.toLowerCase() : '';
                                if (child.nodeType === Node.TEXT_NODE) textoLi += child.textContent;
                                else if (child.nodeType === Node.ELEMENT_NODE && childTag !== 'ul' && childTag !== 'ol') textoLi += child.textContent;
                            });

                            const textoTrim = textoLi.replace(/\s+/g, ' ').trim();
                            if (textoTrim) {
                                agregarBloque(textoTrim, 'left', tagName === 'ul' ? 'viñeta' : 'numerada', { ...estilos }, nuevoSangria, prefijo);
                            }

                            if (tagName === 'ol') contador++;

                            Array.from(li.children).forEach(child => {
                                const childTag = child.tagName ? child.tagName.toLowerCase() : '';
                                if (childTag === 'ul' || childTag === 'ol') procesarNodo(child, 'left', estilos, nuevoSangria);
                            });
                        });
                        return;
                    }

                    let alineacionActual = alineacionPadre;
                    if (nodo.style && nodo.style.textAlign) alineacionActual = nodo.style.textAlign;
                    else {
                        try {
                            const cs = window.getComputedStyle && window.getComputedStyle(nodo);
                            if (cs && cs.textAlign) alineacionActual = cs.textAlign;
                        } catch (e) {}
                    }
                    alineacionActual = normalizarAlineacion(alineacionActual);

                    Array.from(nodo.childNodes).forEach(hijo => procesarNodo(hijo, alineacionActual, estilos, sangria));
                }

                Array.from(temp.childNodes).forEach(node => procesarNodo(node));

                return bloquesBase.map(bloque => {
                    if (bloque.tipo === 'salto') return { tipo: 'salto' };
                    return {
                        tipo: 'texto',
                        segmentos: bloque.segmentos,
                        esLista: bloque.esLista,
                        viñeta: bloque.viñeta || (bloque.esLista ? '• ' : ''),
                        rawText: bloque.rawText,
                        alineacion: bloque.alineacion,
                        sangria: bloque.sangria || 0
                    };
                });
            }

            // Función para calcular espaciado para justificado
            function calcularEspaciadoJustificado(palabras, anchoLinea, anchoMaximo, doc) {
                if (palabras.length < 2) return 0;
                
                const anchoTexto = doc.getTextWidth(palabras.join(' '));
                const espacioDisponible = anchoMaximo - anchoTexto;
                const espaciosNecesarios = palabras.length - 1;
                
                return espacioDisponible / espaciosNecesarios;
            }

            const construirLineasEstilizadas = (styledWords, anchoDisponible) => {
                const lineas = [];
                const espacio = doc.getTextWidth(' ');
                let lineaActual = [];
                let anchoActual = 0;

                styledWords.forEach((sw, idx) => {
                    const anchoPalabra = medirPalabraEstilizada(sw.word, sw.estilos);
                    const espacioPrevio = lineaActual.length > 0 ? espacio : 0;
                    if (anchoActual + espacioPrevio + anchoPalabra <= anchoDisponible || lineaActual.length === 0) {
                        lineaActual.push({ ...sw, width: anchoPalabra });
                        anchoActual += espacioPrevio + anchoPalabra;
                    } else {
                        lineas.push({ palabras: lineaActual, ancho: anchoActual });
                        lineaActual = [{ ...sw, width: anchoPalabra }];
                        anchoActual = anchoPalabra;
                    }
                });

                if (lineaActual.length) lineas.push({ palabras: lineaActual, ancho: anchoActual });
                return lineas;
            };

            // Función mejorada para dibujar texto con justificado y alineaciones heredadas
            function dibujarTextoConJustificado(doc, bloques, x, startY, maxWidth, bottomLimit, topMarginOtras) {
                let currentY = startY;
                const lineHeight = obtenerAltoLinea();

                // Alinea el alto de línea de jsPDF con el usado para los cálculos manuales.
                if (doc.setLineHeightFactor) doc.setLineHeightFactor(LINE_HEIGHT_FACTOR_OBS);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10.5);

                for (let bloque of bloques) {
                    if (bloque.tipo === 'salto') {
                        currentY += lineHeight * 0.8;

                        if (currentY + lineHeight > bottomLimit) {
                            doc.addPage();
                            pageNumber++;
                            totalPages = Math.max(totalPages, pageNumber);
                            addHeader(doc, pageNumber, totalPages);
                            currentY = topMarginOtras;
                        }
                        continue;
                    }

                    if (!bloque.rawText || !bloque.rawText.trim()) continue;

                    const sangria = bloque.sangria ?? (bloque.esLista ? 8 : 0);
                    const inicioX = x + sangria;
                    const anchoDisponible = maxWidth - sangria;
                    const alineacionBloque = bloque.alineacion || 'left';

                    // Palabras con sus estilos individuales
                    const styledWords = [];
                    bloque.segmentos.forEach(seg => {
                        const palabrasSeg = seg.texto.split(/\s+/).filter(Boolean);
                        palabrasSeg.forEach(word => {
                            styledWords.push({
                                word,
                                estilos: {
                                    bold: !!seg.bold,
                                    italic: !!seg.italic,
                                    underline: !!seg.underline
                                }
                            });
                        });
                    });

                    let lineasTexto = construirLineasEstilizadas(styledWords, anchoDisponible);
                    if (!bloque.esLista && alineacionBloque !== 'justify') {
                        const anchoLineaUnica = calcularAnchoEstilizado(bloque.segmentos);
                        if (anchoLineaUnica <= anchoDisponible) {
                            lineasTexto = [{ palabras: lineasTexto.length ? lineasTexto.flatMap(l => l.palabras) : styledWords, ancho: anchoLineaUnica }];
                        }
                    }

                    for (let lineaIdx = 0; lineaIdx < lineasTexto.length; lineaIdx++) {
                        const linea = lineasTexto[lineaIdx];

                        if (currentY + lineHeight > bottomLimit) {
                            doc.addPage();
                            pageNumber++;
                            totalPages = Math.max(totalPages, pageNumber);
                            addHeader(doc, pageNumber, totalPages);
                            currentY = topMarginOtras;
                        }

                        const textoLinea = linea.palabras.map(p => p.word).join(' ');
                        const anchoTexto = linea.ancho;
                        const anchoViñeta = bloque.esLista ? doc.getTextWidth(bloque.viñeta || '• ') : 0;
                        let baseX = inicioX;

                        if (bloque.esLista && (alineacionBloque === 'center' || alineacionBloque === 'right')) {
                            const anchoTotal = anchoTexto + anchoViñeta;
                            baseX = alineacionBloque === 'center'
                                ? x + (anchoDisponible - anchoTotal) / 2
                                : x + (anchoDisponible - anchoTotal);
                        }

                        if (bloque.esLista && lineaIdx === 0) {
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(10.5);
                            doc.text(bloque.viñeta || '• ', baseX, currentY);
                        }

                        let posX = baseX + (bloque.esLista ? anchoViñeta : 0);

                        const esUltimaLinea = lineaIdx === lineasTexto.length - 1;
                        const usarJustificado = alineacionBloque === 'justify' && !bloque.esLista && !esUltimaLinea && linea.palabras.length > 1;

                        if (usarJustificado) {
                            const palabrasSolo = linea.palabras.map(p => p.word);
                            const espaciadoExtra = calcularEspaciadoJustificado(
                                palabrasSolo,
                                linea.ancho,
                                anchoDisponible,
                                doc
                            );

                            for (let palabraIdx = 0; palabraIdx < linea.palabras.length; palabraIdx++) {
                                const palabra = linea.palabras[palabraIdx].word;
                                const estiloPalabra = linea.palabras[palabraIdx].estilos || {};

                                let fontStyle = 'normal';
                                if (estiloPalabra.bold && estiloPalabra.italic) fontStyle = 'bolditalic';
                                else if (estiloPalabra.bold) fontStyle = 'bold';
                                else if (estiloPalabra.italic) fontStyle = 'italic';

                                doc.setFont('helvetica', fontStyle);
                                doc.setFontSize(10.5);
                                doc.text(palabra, posX, currentY);

                                if (estiloPalabra.underline) {
                                    const anchoPalabra = linea.palabras[palabraIdx].width ?? doc.getTextWidth(palabra);
                                    const underlineY = currentY + 0.6;
                                    doc.setDrawColor(0, 0, 0);
                                    doc.setLineWidth(0.08);
                                    doc.line(posX, underlineY, posX + anchoPalabra, underlineY);
                                }

                                posX += linea.palabras[palabraIdx].width ?? doc.getTextWidth(palabra);

                                if (palabraIdx < linea.palabras.length - 1) {
                                    const espacioNormal = doc.getTextWidth(' ');
                                    const espacioTotal = espacioNormal + espaciadoExtra;
                                    posX += espacioTotal;
                                }
                            }
                        } else {
                            let posXActual = baseX + (bloque.esLista ? anchoViñeta : 0);

                            if (!bloque.esLista && alineacionBloque === 'center') {
                                posXActual = inicioX + (anchoDisponible - anchoTexto) / 2;
                            } else if (!bloque.esLista && alineacionBloque === 'right') {
                                posXActual = inicioX + (anchoDisponible - anchoTexto);
                            }

                            for (let palabraIdx = 0; palabraIdx < linea.palabras.length; palabraIdx++) {
                                const palabra = linea.palabras[palabraIdx].word;
                                const estiloPalabra = linea.palabras[palabraIdx].estilos || {};

                                let fontStyle = 'normal';
                                if (estiloPalabra.bold && estiloPalabra.italic) fontStyle = 'bolditalic';
                                else if (estiloPalabra.bold) fontStyle = 'bold';
                                else if (estiloPalabra.italic) fontStyle = 'italic';

                                doc.setFont('helvetica', fontStyle);
                                doc.setFontSize(10.5);
                                doc.text(palabra, posXActual, currentY);

                                if (estiloPalabra.underline) {
                                    const anchoTexto = linea.palabras[palabraIdx].width ?? doc.getTextWidth(palabra);
                                    const underlineY = currentY + 0.6;
                                    doc.setDrawColor(0, 0, 0);
                                    doc.setLineWidth(0.08);
                                    doc.line(posXActual, underlineY, posXActual + anchoTexto, underlineY);
                                }

                                posXActual += linea.palabras[palabraIdx].width ?? doc.getTextWidth(palabra);
                                if (palabraIdx < linea.palabras.length - 1) {
                                    posXActual += doc.getTextWidth(' ');
                                }
                            }
                        }

                        currentY += lineHeight;
                    }

                    currentY += lineHeight * 0.05;
                }

                return currentY;
            }

            /* ==========================================
               APLICAR EL SISTEMA A LAS OBSERVACIONES
               ========================================== */
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);

            const htmlObs = document.getElementById('sug_observaciones').innerHTML || '';
            const bloquesObservaciones = procesarHTMLParaPDFObservaciones(htmlObs);

            currentY = dibujarTextoConJustificado(
                doc,
                bloquesObservaciones,
                marginLeft,
                currentY,
                contentWidth,
                bottomLimit,
                topMarginOtras
            );

            /* ==========================================
               PÁRRAFO FINAL DE AGRADECIMIENTO - MEJOR JUSTIFICADO
               ========================================== */
            currentY += 6;

            const agradecimiento = "De antemano agradezco su colaboración para resolver las inquietudes y sugerencias mencionadas, las cuales son importantes para asegurar la calidad en la fabricación y adaptación del dispositivo médico formulado.";

            if (currentY + 25 > bottomLimit) {
                doc.addPage();
                pageNumber++;
                totalPages++;
                currentY = marginTop + topMarginOtras;
                addHeader(doc, pageNumber, totalPages);
            }
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);
            
            doc.text(agradecimiento, marginLeft, currentY, {
                maxWidth: contentWidth - 1, // REDUCIDO 1mm
                align: 'justify',
                lineHeightFactor: 1.15
            });
            
            currentY += 18;

            /* ==========================================
               FIRMA Y DATOS FINALES
               ========================================== */
            if (currentY + 35 > bottomLimit) {
                doc.addPage();
                pageNumber++;
                totalPages++;
                currentY = marginTop + topMarginOtras;
                addHeader(doc, pageNumber, totalPages);
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text('Cordialmente,', marginLeft, currentY);
            currentY += 9;

            let selloText = window.datosParaPDF?.creado_por || '<?php echo $usuarioLogueado; ?>';
            selloText = selloText.replace(/\s+/g, '');
            const selloWidth = 80;
            const selloHeight = 18;

            function setFuenteFirma(doc) {
                try {
                    doc.addFont('/fuentes_ttf/rastanty-cortez.ttf', 'Rastanty Cortez', 'normal');
                    doc.setFont('Rastanty Cortez', 'normal');
                } catch {
                    const fallbackFonts = [ 'Great Vibes', 'Dancing Script', 'Brush Script MT', 'Segoe Script', 'times', 'italic' ];
                    for (let i = 0; i < fallbackFonts.length; i += 2) {
                        try { doc.setFont(fallbackFonts[i], fallbackFonts[i + 1] || 'normal'); break; } catch {}
                    }
                }
            }

            doc.setTextColor(0, 0, 0).setFont('helvetica').setFontSize(10).text('Firma:', marginLeft, currentY + 7);
            doc.setTextColor(20, 20, 20).setFontSize(32);
            setFuenteFirma(doc);

            const firmaY = currentY + 17;
            doc.setCharSpace(-1.1);
            const anchoTextoFirma = doc.getTextWidth(selloText) + (selloText.length - 1) * -1.1 / doc.internal.scaleFactor;
            doc.setCharSpace(0);
            const margenExtra = -3;
            const lineaAncho = Math.min(anchoTextoFirma + margenExtra, selloWidth);
            doc.setDrawColor(0, 0, 0).setLineWidth(0.3).line(marginLeft, firmaY - 0.3, marginLeft + lineaAncho, firmaY - 0.3);

            doc.setCharSpace(-1.1).text(selloText, marginLeft, firmaY, { align: 'left', maxWidth: selloWidth, lineHeightFactor: 1 }).setCharSpace(0);
            doc.setTextColor(0, 0, 0).setFont('helvetica', 'normal').setFontSize(9);

            currentY += selloHeight + 6;
            doc.text('Técnico: ' + (window.datosParaPDF.creado_por || '<?php echo $usuarioLogueado; ?>'), marginLeft, currentY);
            currentY += 5;
            doc.text('Cargo: ' + (window.datosParaPDF.cargo || '<?php echo $cargo; ?>'), marginLeft, currentY);
            currentY += 5;
            doc.setFont('helvetica', 'bold');
            doc.text('ORTOPEDICA TEUSAQUILLO', marginLeft, currentY);

            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.text(`PÁGINA ${i} DE ${totalPages}`, marginLeft + 130 + 2, marginTop + headerRowHeight * 2 + 4);
            }

            doc.setPage(1);
            return doc;
        },

        /* ==========================================
           MOSTRAR PDF EN MODAL
           ========================================== */
        mostrarPdfEnModal: async function() {
            try {
                const doc = this.generarDocumentoProfesional();
                const paciente = JSON.parse(localStorage.getItem('datosPaciente') || "{}");
                const nombrePaciente = paciente?.nombre ? paciente.nombre.replace(/\s+/g, '_') : 'paciente';
                const fechaHora = window.fechaHora || new Date().toISOString();
                const fechaObj = new Date(fechaHora);
                const fechaStr = fechaObj.toISOString().split('T')[0];
                const nombreArchivo = `sugerencia-formula-medica_${nombrePaciente}_${fechaStr}.pdf`;

                const blob = await doc.output('blob');
                const blobUrl = URL.createObjectURL(blob);

                const iframeHtml = `
                    <div style="position: relative; width: 100%;">
                        <div style="position: absolute; top: 12px; right: 10px; display: flex; gap: 8px; z-index: 1000;">
                            <a id="descargar-pdf" href="${blobUrl}" download="${nombreArchivo}" style="background-color: #3085d6; color: white; padding: 10px 15px; border-radius: 4px; text-decoration: none; font-size: 14px;"> Descargar PDF </a>
                            <button id="imprimir-pdf" style="background-color: #28a745; color: white; padding: 10px 15px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px;"> Imprimir </button>
                        </div>
                        <div style="width: 100%; height: calc(100vh - 100px); margin-top: 40px;">
                            <iframe id="pdf-frame" src="${blobUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
                        </div>
                    </div>
                `;

                Swal.fire({
                    html: iframeHtml,
                    width: '90%',
                    showConfirmButton: false,
                    showCloseButton: true,
                    didOpen: () => {
                        document.getElementById('imprimir-pdf').addEventListener('click', () => {
                            const iframe = document.getElementById('pdf-frame');
                            iframe.contentWindow.focus();
                            iframe.contentWindow.print();
                        });
                    },
                    willClose: () => {
                        if (window.datosParaPDF) {
                            for (const key in window.datosParaPDF) { delete window.datosParaPDF[key]; }
                        }
                        const iframe = document.getElementById('pdf-frame');
                        if (iframe) iframe.src = 'about:blank';
                        URL.revokeObjectURL(blobUrl);
                        $('#btn-guardar-sugerencia').prop('disabled', true);
                    }
                });

            } catch (error) {
                console.error('Error al generar PDF:', error);
                Swal.fire('Error', 'No se pudo generar el documento', 'error');
            }
        }
    };

    /* ==========================================
       EVENTOS BOTONES
       ========================================== */
    const actualizarObservacionesYMostrarPDF = (botonId) => {
        const observaciones = $('#sug_observaciones').html()?.trim() || 'No se registraron observaciones';
        window.datosParaPDF = window.datosParaPDF || {};
        window.datosParaPDF.observaciones = observaciones;

        let mensaje = '';
        if (botonId === 'btn-guardar-sugerencia') {
            mensaje = 'Generando PDF de la sugerencia médica...';
        } else if (botonId === 'btn_ver') {
            mensaje = 'Cargando documento PDF...';
        } else {
            mensaje = 'Procesando...';
        }

        Swal.fire({
            title: mensaje,
            timer: 3000,
            didOpen: () => {
                Swal.showLoading();
            },
            willClose: () => {
                if (typeof pdfViewer !== 'undefined' && pdfViewer.mostrarPdfEnModal) {
                    pdfViewer.mostrarPdfEnModal();
                } else {
                    console.error('Error: pdfViewer no está definido');
                }
            }
        });
    };

    document.getElementById('btn-guardar-sugerencia')?.addEventListener('click', () => {
        actualizarObservacionesYMostrarPDF('btn-guardar-sugerencia');
    });
    document.getElementById('btn_ver')?.addEventListener('click', () => {
        actualizarObservacionesYMostrarPDF('btn_ver');
    });
}

// Inicializar
initPdfViewer();
</script>
