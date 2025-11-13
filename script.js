         let totalElectores = 0;
        let votosRegistrados = new Set();
        let historialVotos = [];
        let hojas = [];
        let numeroActual = '';
        let fiscalizacionActualId = null;

        document.addEventListener('DOMContentLoaded', () => {
            cargarListaFiscalizaciones();
        });

        function cargarListaFiscalizaciones() {
            const fiscalizaciones = obtenerTodasFiscalizaciones();
            const lista = document.getElementById('listaFiscalizaciones');
            
            if (fiscalizaciones.length === 0) {
                lista.innerHTML = '<div class="sin-fiscalizaciones">No hay fiscalizaciones guardadas</div>';
                return;
            }

            lista.innerHTML = '';
            fiscalizaciones.forEach(fisc => {
                const div = document.createElement('div');
                div.className = 'item-fiscalizacion';
                const porcentaje = ((fisc.votosCount / fisc.totalElectores) * 100).toFixed(1);
                div.innerHTML = `
                    <div class="fisc-info">
                        <div class="fisc-nombre">${fisc.nombre}</div>
                        <div class="fisc-stats">${fisc.votosCount}/${fisc.totalElectores} votos (${porcentaje}%)</div>
                        <div class="fisc-fecha">${new Date(fisc.fecha).toLocaleString()}</div>
                    </div>
                    <div class="fisc-acciones">
                        <button class="btn-abrir" onclick="abrirFiscalizacion('${fisc.id}')">Abrir</button>
                        <button class="btn-eliminar" onclick="eliminarFiscalizacion('${fisc.id}')">🗑️</button>
                    </div>
                `;
                lista.appendChild(div);
            });
        }

        function obtenerTodasFiscalizaciones() {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('fisc_'));
            return keys.map(key => {
                const data = JSON.parse(localStorage.getItem(key));
                return {
                    id: key,
                    nombre: data.nombre,
                    totalElectores: data.totalElectores,
                    votosCount: data.votosRegistrados.length,
                    fecha: data.fecha
                };
            }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }

        function mostrarConfiguracion() {
            document.getElementById('seleccionSection').classList.add('hidden');
            document.getElementById('configSection').classList.remove('hidden');
            document.getElementById('nombreMesa').value = '';
            document.getElementById('totalElectores').value = '350';
        }

        function volverASeleccion() {
            fiscalizacionActualId = null;
            totalElectores = 0;
            votosRegistrados = new Set();
            historialVotos = [];
            hojas = [];
            numeroActual = '';
            
            document.getElementById('configSection').classList.add('hidden');
            document.getElementById('mainSection').classList.add('hidden');
            document.getElementById('seleccionSection').classList.remove('hidden');
            
            document.getElementById('titulo').classList.remove('hidden');
            document.getElementById('tituloMesa').classList.add('hidden');
            
            cargarListaFiscalizaciones();
        }

        function abrirFiscalizacion(id) {
            const data = JSON.parse(localStorage.getItem(id));
            if (!data) return;

            fiscalizacionActualId = id;
            totalElectores = data.totalElectores;
            votosRegistrados = new Set(data.votosRegistrados);
            historialVotos = data.historialVotos;
            hojas = data.hojas;
            numeroActual = '';

            document.getElementById('seleccionSection').classList.add('hidden');
            document.getElementById('mainSection').classList.remove('hidden');
            
            // AGREGAR ESTAS TRES LÍNEAS:
            document.getElementById('titulo').classList.add('hidden');
            document.getElementById('tituloMesa').classList.remove('hidden');
            document.getElementById('tituloMesa').textContent = data.nombre;
            
            document.getElementById('infoMesa').innerHTML = `
                <div class="orden-text">Ingrese número de orden</div>
            `;
            actualizarDisplay();
        }

        function eliminarFiscalizacion(id) {
            const data = JSON.parse(localStorage.getItem(id));
            
            Swal.fire({
                title: `¿Eliminar la ${data.nombre}?`,
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem(id);
                    cargarListaFiscalizaciones();
                    Swal.fire({
                        title: '¡Eliminada!',
                        text: 'La fiscalización ha sido eliminada',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            });
        }

        function iniciarFiscalizacion() {
            // Limpiar errores previos
            document.getElementById('errorMesa').classList.add('hidden');
            document.getElementById('errorElectores').classList.add('hidden');
            document.getElementById('nombreMesa').classList.remove('input-error');
            document.getElementById('totalElectores').classList.remove('input-error');
            
            const mesaNum = parseInt(document.getElementById('nombreMesa').value);
            const inputElectores = document.getElementById('totalElectores').value;
            const totalElec = parseInt(inputElectores);
            
            let hayError = false;
            
            // Validar número de mesa
            if (!mesaNum || mesaNum < 1 || mesaNum > 99999) {
                document.getElementById('errorMesa').textContent = 'Por favor ingrese un número de mesa válido entre 1 y 99999';
                document.getElementById('errorMesa').classList.remove('hidden');
                document.getElementById('nombreMesa').classList.add('input-error');
                hayError = true;
            }
            
            // Validar total de electores
            if (totalElec < 1 || totalElec > 400) {
                document.getElementById('errorElectores').textContent = 'Por favor ingrese un número válido entre 1 y 400';
                document.getElementById('errorElectores').classList.remove('hidden');
                document.getElementById('totalElectores').classList.add('input-error');
                hayError = true;
            }
            
            // Si hay errores, no continuar
            if (hayError) {
                return;
            }
            
            // Si todo está bien, continuar
            const nombre = `Mesa ${mesaNum}`;
            totalElectores = totalElec;

            fiscalizacionActualId = 'fisc_' + Date.now();
            
            document.getElementById('configSection').classList.add('hidden');
            document.getElementById('mainSection').classList.remove('hidden');
            
            document.getElementById('titulo').classList.add('hidden');
            document.getElementById('tituloMesa').classList.remove('hidden');
            document.getElementById('tituloMesa').textContent = nombre;
            document.getElementById('infoMesa').innerHTML = `
                <div class="orden-text">Ingrese número de orden</div>
            `;

            crearHojas();
            guardarDatos(nombre);
            actualizarDisplay();
        }

        function crearHojas() {
            const numHojas = Math.ceil(totalElectores / 32);
            hojas = [];

            for (let i = 0; i < numHojas; i++) {
                hojas.push({
                    numero: i + 1,
                    inicio: i * 32 + 1,
                    fin: Math.min((i + 1) * 32, totalElectores),
                    votos: 0
                });
            }
        }

        function agregarDigito(digito) {
            if (numeroActual.length < 3) {
                numeroActual += digito;
                actualizarDisplay();
            }
        }

        function borrarDigito() {
            numeroActual = numeroActual.slice(0, -1);
            actualizarDisplay();
        }

        function actualizarDisplay() {
            const display = document.getElementById('numberDisplay');
            display.textContent = numeroActual || '-';
        }

        function agregarVoto() {
            const numero = parseInt(numeroActual);

            if (!numeroActual || numero < 1 || numero > totalElectores) {
                mostrarMensaje('error', `Ingrese un número entre 1 y ${totalElectores}`);
                numeroActual = '';
                actualizarDisplay();
                return;
            }

            if (votosRegistrados.has(numero)) {
                mostrarMensaje('error', `El elector ${numero} ya votó`);
                numeroActual = '';
                actualizarDisplay();
                return;
            }

            votosRegistrados.add(numero);
            historialVotos.push(numero);

            const hoja = hojas.find(h => numero >= h.inicio && numero <= h.fin);
            if (hoja) {
                hoja.votos++;
            }

            guardarDatos();
            mostrarMensaje('success', `✓ Elector ${numero} registrado`);
            numeroActual = '';
            actualizarDisplay();
        }

        function deshacerUltimo() {
            if (historialVotos.length === 0) {
                mostrarMensaje('error', 'No hay votos para deshacer');
                return;
            }

            const ultimoVoto = historialVotos.pop();
            votosRegistrados.delete(ultimoVoto);

            const hoja = hojas.find(h => ultimoVoto >= h.inicio && ultimoVoto <= h.fin);
            if (hoja) {
                hoja.votos--;
            }

            guardarDatos();
            mostrarMensaje('success', `Se deshizo el voto ${ultimoVoto}`);
        }

        function reiniciar() {
            Swal.fire({
                title: '¿Seguro que desea borrar todos los datos?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sí, reiniciar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    votosRegistrados.clear();
                    historialVotos = [];
                    hojas.forEach(h => h.votos = 0);
                    numeroActual = '';
                    actualizarDisplay();
                    guardarDatos();
                    mostrarMensaje('success', 'Datos reiniciados');
                }
            });
        }

        function mostrarEstado() {
            document.getElementById('votosCount').textContent = votosRegistrados.size;
            document.getElementById('totalMesa').textContent = totalElectores;
            document.getElementById('faltanCount').textContent = totalElectores - votosRegistrados.size;
            const porcentaje = totalElectores > 0 ? ((votosRegistrados.size / totalElectores) * 100).toFixed(1) : 0;
            document.getElementById('porcentajeVoto').textContent = porcentaje + '%';
            document.getElementById('estadoModal').classList.add('active');
        }

        function mostrarProgreso() {
            renderizarHojas();
            document.getElementById('progresoModal').classList.add('active');
        }

        function cerrarModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function renderizarHojas() {
            const grid = document.getElementById('sheetsGrid');
            grid.innerHTML = '';

            hojas.forEach(hoja => {
                const div = document.createElement('div');
                div.className = 'sheet-box' + (hoja.votos > 0 ? ' has-votes' : '');
                div.innerHTML = `
                    <div class="sheet-number">Hoja ${hoja.numero}</div>
                    <div class="sheet-count">${hoja.votos}/${hoja.fin - hoja.inicio + 1}</div>
                `;
                grid.appendChild(div);
            });
        }

        function mostrarMensaje(tipo, texto) {
            const msg = document.getElementById('message');
            msg.className = 'message ' + tipo;
            msg.textContent = texto;
            setTimeout(() => {
                msg.className = 'message';
            }, 2500);
        }

        function guardarDatos(nombre) {
            if (!fiscalizacionActualId) return;
            
            const nombreFisc = nombre || JSON.parse(localStorage.getItem(fiscalizacionActualId))?.nombre || 'Mesa sin nombre';
            
            const datos = {
                nombre: nombreFisc,
                totalElectores,
                votosRegistrados: Array.from(votosRegistrados),
                historialVotos,
                hojas,
                fecha: new Date().toISOString()
            };
            localStorage.setItem(fiscalizacionActualId, JSON.stringify(datos));
        }

        function cargarDatos() {
            const datos = localStorage.getItem('fiscalizacion');
            if (datos) {
                const parsed = JSON.parse(datos);
                if (parsed.totalElectores === totalElectores) {
                    votosRegistrados = new Set(parsed.votosRegistrados);
                    historialVotos = parsed.historialVotos;
                    if (parsed.hojas) {
                        hojas = parsed.hojas;
                    }
                }
            }
        }

        // Cerrar modales al hacer clic fuera
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.classList.remove('active');
            }
        }


        function renderizarHojas() {
            const grid = document.getElementById('sheetsGrid');
            grid.innerHTML = '';

            hojas.forEach(hoja => {
                const div = document.createElement('div');
                div.className = 'sheet-box' + (hoja.votos > 0 ? ' has-votes' : '');
                div.innerHTML = `
                    <div class="sheet-number">Hoja ${hoja.numero}</div>
                    <div class="sheet-count">${hoja.votos}/${hoja.fin - hoja.inicio + 1}</div>
                    <div class="sheet-range">(${hoja.inicio}-${hoja.fin})</div>
                `;
                div.onclick = () => mostrarDetalleHoja(hoja);
                grid.appendChild(div);
            });
        }

function mostrarDetalleHoja(hoja) {
    document.getElementById('detalleHojaTitulo').textContent = `📄 Hoja ${hoja.numero} (${hoja.inicio}-${hoja.fin})`;
    
    const grid = document.getElementById('numerosGrid');
    grid.innerHTML = '';

    for (let num = hoja.inicio; num <= hoja.fin; num++) {
        const div = document.createElement('div');
        const haVotado = votosRegistrados.has(num);
        
        div.className = 'numero-box' + (haVotado ? ' votado' : ' no-votado');
        
        // Formatear el número con ceros a la izquierda (001, 002, etc.)
        const numeroFormateado = num.toString().padStart(3, '0');
        
        if (haVotado) {
            // Si votó: mostrar número y botón eliminar
            div.innerHTML = `
                <span>${numeroFormateado}</span>
                <button class="eliminar-btn" onclick="event.stopPropagation(); eliminarVoto(${num}, ${hoja.numero})">×</button>
            `;
        } else {
            // Si no votó: solo el número
            div.textContent = numeroFormateado;
        }
        
        grid.appendChild(div);
    }

    document.getElementById('detalleHojaModal').classList.add('active');
}
function eliminarVoto(numero, numeroHoja) {
    if (confirm(`¿Eliminar el voto del elector ${numero}?`)) {
        votosRegistrados.delete(numero);
        
        const index = historialVotos.indexOf(numero);
        if (index > -1) {
            historialVotos.splice(index, 1);
        }

        const hoja = hojas.find(h => h.numero === numeroHoja);
        if (hoja) {
            hoja.votos--;
        }

        guardarDatos();
        mostrarMensaje('success', `Se eliminó el voto ${numero}`);
        
        // Actualizar la vista del detalle
        mostrarDetalleHoja(hoja);
        
        // Actualizar la vista de progreso (si está abierta)
        const progresoModal = document.getElementById('progresoModal');
        if (progresoModal.classList.contains('active')) {
            renderizarHojas();
        }
    }
}

    function confirmarVolverInicio() {
        Swal.fire({
            title: '¿Volver a la pantalla de inicio?',
            text: 'Los datos de esta fiscalización están guardados.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, volver',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                volverASeleccion();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('nombreMesa').addEventListener('input', () => {
        document.getElementById('errorMesa').classList.add('hidden');
        document.getElementById('nombreMesa').classList.remove('input-error');
    });
    
    document.getElementById('totalElectores').addEventListener('input', () => {
        document.getElementById('errorElectores').classList.add('hidden');
        document.getElementById('totalElectores').classList.remove('input-error');
    });
});