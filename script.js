        let totalElectores = 0;
        let votosRegistrados = new Set();
        let historialVotos = [];
        let hojas = [];
        let numeroActual = '';

        function iniciarFiscalizacion() {
            document.getElementById('titulo').textContent = '📋 Número de orden';
            const input = document.getElementById('totalElectores').value;
            totalElectores = parseInt(input);

            if (totalElectores < 1 || totalElectores > 400) {
                alert('Por favor ingrese un número válido entre 1 y 400');
                return;
            }
            document.getElementById('configSection').classList.add('hidden');
            document.getElementById('mainSection').classList.remove('hidden');

            crearHojas();
            cargarDatos();
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
            if (confirm('¿Seguro que desea reiniciar todos los datos?')) {
                votosRegistrados.clear();
                historialVotos = [];
                hojas.forEach(h => h.votos = 0);
                numeroActual = '';
                actualizarDisplay();
                guardarDatos();
                mostrarMensaje('success', 'Datos reiniciados');
            }
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

        function guardarDatos() {
            const datos = {
                totalElectores,
                votosRegistrados: Array.from(votosRegistrados),
                historialVotos,
                hojas
            };
            localStorage.setItem('fiscalizacion', JSON.stringify(datos));
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