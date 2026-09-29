// ======================================================
// ESTADO GLOBAL
// ======================================================
let usuarioSesion = null;
let calificacionSeleccionada = 5;

// ======================================================
// EFECTO VISUAL: POCHOCLOS
// ======================================================
function explotarPochoclos(e) {
  const rect = e.target.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'popcorn-particle';
    p.textContent = '🍿';

    const dx = (Math.random() - 0.5) * 200 + 'px';
    const dy = -(Math.random() * 150 + 50) + 'px';
    const rot = (Math.random() - 0.5) * 360 + 'deg';

    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--dx', dx);
    p.style.setProperty('--dy', dy);
    p.style.setProperty('--rot', rot);

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

// ======================================================
// GEOLOCALIZACIÓN
// ======================================================
function obtenerUbicacion() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      alert("El dispositivo no permite obtener la ubicación.");
      resolve({ latitud: null, longitud: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const lat = posicion.coords.latitude;
        const lng = posicion.coords.longitude;

        const inputLat = document.getElementById("latitud");
        const inputLng = document.getElementById("longitud");

        if (inputLat) inputLat.value = lat;
        if (inputLng) inputLng.value = lng;

        resolve({ latitud: lat, longitud: lng });
      },
      (error) => {
        console.warn("No se pudo obtener la ubicación:", error.message);
        resolve({ latitud: null, longitud: null });
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  });
}

// ======================================================
// MODAL & AUTENTICACIÓN (LOGIN / LOGOUT)
// ======================================================
function abrirModalLogin() {
  document.getElementById('modal-login')?.classList.remove('hidden');
}

function cerrarModalLogin() {
  document.getElementById('modal-login')?.classList.add('hidden');
}

async function procesarLogin(e) {
  e.preventDefault();

  const emailEl = document.getElementById('login-email');
  const passwordEl = document.getElementById('login-password');

  if (!emailEl || !passwordEl) return;

  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  try {
    const res = await fetch('login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const texto = await res.text();
    let data;

    try {
      data = JSON.parse(texto);
    } catch {
      alert('❌ Respuesta inválida del servidor (no es JSON).');
      return;
    }

    if (data.success) {
      usuarioSesion = data;
      cerrarModalLogin();
      activarPanel(data.rol, data.nombre);
    } else {
      alert(data.message || 'Credenciales incorrectas.');
    }
  } catch (err) {
    alert(`❌ Error al conectar con el servidor: ${err.message}`);
  }
}

function activarPanel(rol, nombre) {
  document.getElementById('vista-publica')?.classList.add('hidden');
  document.getElementById('btn-abrir-login')?.classList.add('hidden');

  const labelUsuario = document.getElementById('label-usuario');
  if (labelUsuario) {
    labelUsuario.classList.remove('hidden');
    labelUsuario.textContent = rol === 'admin' ? `👑 Admin: ${nombre}` : `🛒 ${nombre}`;
  }

  document.getElementById('btn-cerrar-sesion')?.classList.remove('hidden');

  const vistaAdmin = document.getElementById('vista-admin');
  const vistaEmpleado = document.getElementById('vista-empleado');

  if (rol === 'admin') {
    vistaEmpleado?.classList.add('hidden');
    vistaAdmin?.classList.remove('hidden');
    renderizarEmpleados();
  } else {
    vistaAdmin?.classList.add('hidden');
    vistaEmpleado?.classList.remove('hidden');
  }
}

function cerrarSesion() {
  usuarioSesion = null;

  const ocultar = ['vista-admin', 'vista-empleado', 'label-usuario', 'btn-cerrar-sesion'];
  const mostrar = ['vista-publica', 'btn-abrir-login'];

  ocultar.forEach(id => document.getElementById(id)?.classList.add('hidden'));
  mostrar.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
}

// ======================================================
// GESTIÓN DE EMPLEADOS
// ======================================================
async function renderizarEmpleados() {
  const lista = document.getElementById('tabla-empleados');
  if (!lista) return;

  lista.innerHTML = '<li>Cargando empleados...</li>';

  try {
    const res = await fetch('empleados.php');
    const data = await res.json();

    if (data.success) {
      if (!data.empleados || data.empleados.length === 0) {
        lista.innerHTML = '<li style="color: #64748b;">No hay empleados registrados.</li>';
        return;
      }

      lista.innerHTML = data.empleados.map(emp => `
        <li>
          <span>
            <strong>${emp.nombre} ${emp.apellido}</strong> - ${emp.email}<br>
            <small style="color: #64748b;">
              Carrito Asignado ID: ${emp.carrito_id || 'Sin asignación'}
            </small>
          </span>
          <button class="btn btn-danger" onclick="eliminarEmpleado(${emp.id})">Borrar</button>
        </li>
      `).join('');
    } else {
      lista.innerHTML = '<li style="color: #ef4444;">Error al obtener empleados.</li>';
    }
  } catch {
    lista.innerHTML = '<li style="color: #ef4444;">Error de conexión con el servidor.</li>';
  }
}

async function crearEmpleado(e) {
  e.preventDefault();

  const nombre = document.getElementById('emp-nombre')?.value.trim();
  const apellido = document.getElementById('emp-apellido')?.value.trim();
  const email = document.getElementById('emp-email')?.value.trim();
  const password = document.getElementById('emp-password')?.value.trim();
  const carrito_id = document.getElementById('emp-carrito')?.value;

  try {
    const res = await fetch('empleados.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellido, email, password, carrito_id })
    });

    const data = await res.json();

    if (data.success) {
      alert(`✅ ${data.message}`);
      e.target.reset();
      renderizarEmpleados();
    } else {
      alert(`⚠️ ${data.message}`);
    }
  } catch {
    alert('❌ Error al conectar con el servidor.');
  }
}

async function eliminarEmpleado(id) {
  if (!confirm('¿Seguro que querés eliminar la cuenta de este empleado?')) return;

  try {
    const res = await fetch('empleados.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    const data = await res.json();

    if (data.success) {
      alert(`✅ ${data.message}`);
      renderizarEmpleados();
    } else {
      alert(`⚠️ ${data.message}`);
    }
  } catch {
    alert('❌ Error al procesar la eliminación.');
  }
}

// ======================================================
// SISTEMA DE VENTAS CON COORDENADAS
// ======================================================
async function registrarVenta(e) {
  e.preventDefault();

  const productoElement = document.getElementById('venta-producto');
  const cantidadElement = document.getElementById('venta-cantidad');

  if (!productoElement || !cantidadElement) return;

  const producto_id = parseInt(productoElement.value, 10);
  const cantidad = parseInt(cantidadElement.value, 10);

  if (!producto_id || producto_id <= 0) {
    alert('⚠️ Seleccioná un producto.');
    return;
  }

  if (!cantidad || cantidad <= 0) {
    alert('⚠️ La cantidad debe ser mayor a 0.');
    return;
  }

  // Intentar obtener las coordenadas existentes en los inputs o capturarlas del GPS
  let latitud = document.getElementById('latitud')?.value || null;
  let longitud = document.getElementById('longitud')?.value || null;

  if (!latitud || !longitud) {
    const coords = await obtenerUbicacion();
    latitud = coords.latitud;
    longitud = coords.longitud;
  }

  try {
    const res = await fetch('ventas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto_id,
        cantidad,
        latitud,
        longitud
      })
    });

    const texto = await res.text();
    let data;

    try {
      data = JSON.parse(texto);
    } catch {
      alert('❌ ventas.php no devolvió JSON válido.');
      return;
    }

    if (data.success) {
      alert(`✅ ${data.message}\n\nProducto: ${data.producto || ''}\nCantidad: ${data.cantidad || cantidad}\nCarrito: #${data.carrito_id || ''}`);
      e.target.reset();

      // Limpiar inputs de coordenadas si existen
      if (document.getElementById('latitud')) document.getElementById('latitud').value = '';
      if (document.getElementById('longitud')) document.getElementById('longitud').value = '';
    } else {
      alert(`⚠️ ${data.message || 'No se pudo registrar la venta.'}`);
    }
  } catch (err) {
    alert(`❌ Error de conexión con ventas.php.\n\n${err.message}`);
  }
}

// ======================================================
// CALIFICACIÓN & COMENTARIOS
// ======================================================
function seleccionarCalificacion(valor) {
  calificacionSeleccionada = valor;
  const bolsitas = document.querySelectorAll('#rating-container .popcorn-star');

  bolsitas.forEach((b, index) => {
    b.classList.toggle('active', index < valor);
  });
}

function guardarComentario(e) {
  e.preventDefault();

  const nombre = document.getElementById('com-nombre')?.value || '';
  const apellido = document.getElementById('com-apellido')?.value || '';
  const texto = document.getElementById('com-texto')?.value || '';
  const bolsitasStr = '🍿'.repeat(calificacionSeleccionada);
  const lista = document.getElementById('lista-comentarios');

  if (!lista) return;

  const nuevoComentario = `
    <div class="comment-item">
      <div class="comment-header">
        <span class="comment-author">${nombre} ${apellido}</span>
        <span>${bolsitasStr}</span>
      </div>
      <p style="font-size: 0.88rem; color: #334155;">${texto}</p>
    </div>
  `;

  lista.insertAdjacentHTML('afterbegin', nuevoComentario);
  e.target.reset();
  seleccionarCalificacion(5);
}