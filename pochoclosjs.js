let usuarioSesion = null;
let calificacionActual = 5;
let productosDisponibles = [];
let maletinesDisponibles = [];

// 1. CARGAR RESEÑAS / COMENTARIOS DESDE LA BD
async function cargarComentarios() {
  const lista = document.getElementById('lista-comentarios');
  if (!lista) return;

  try {
    const respuesta = await fetch('resenas.php');
    const datos = await respuesta.json();

    if (!datos.success) {
      lista.innerHTML = '<p>Todavía no hay comentarios publicados.</p>';
      return;
    }

    lista.innerHTML = '';

    if (!datos.resenas || datos.resenas.length === 0) {
      lista.innerHTML = '<p>Todavía no hay comentarios. ¡Sé el primero en opinar!</p>';
      return;
    }

    datos.resenas.forEach((resena) => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'comment-item';

      const puntuacion = Math.max(1, Math.min(5, Number(resena.puntuacion) || 5));
      const estrellas = '🍿'.repeat(puntuacion);

      tarjeta.innerHTML = `
        <div class="comment-header">
          <span class="comment-author">${resena.nombre_cliente}</span>
          <span>${estrellas}</span>
        </div>
        <p style="font-size: 0.88rem; color: #334155; margin-top: 4px;">${resena.comentario}</p>
      `;

      lista.appendChild(tarjeta);
    });
  } catch (error) {
    console.error('Error al cargar reseñas:', error);
    lista.innerHTML = '<p style="color: #ef4444;">Error de conexión con las reseñas.</p>';
  }
}

// 2. GUARDAR RESEÑA EN LA BD
async function guardarComentario(evento) {
  evento.preventDefault();

  const nombre = document.getElementById('com-nombre').value.trim();
  const apellido = document.getElementById('com-apellido').value.trim();
  const comentario = document.getElementById('com-texto').value.trim();

  if (!nombre || !apellido || !comentario) {
    alert('Por favor completá tu nombre, apellido y opinión.');
    return;
  }

  try {
    const respuesta = await fetch('resenas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombre,
        apellido: apellido,
        comentario: comentario,
        puntuacion: calificacionActual
      })
    });

    const textoRespuesta = await respuesta.text();
    let datos;

    try {
      datos = JSON.parse(textoRespuesta);
    } catch (e) {
      console.error("Respuesta no válida del servidor:", textoRespuesta);
      alert("Error en la respuesta del servidor PHP. Revisa la consola.");
      return;
    }

    if (datos.success) {
      alert('✅ ' + datos.message);
      document.getElementById('form-comentario').reset();
      seleccionarCalificacion(5);
      cargarComentarios();
    } else {
      alert('⚠️ ' + datos.message);
    }
  } catch (error) {
    console.error('Error en fetch:', error);
    alert('❌ Error al conectar con el servidor: ' + error.message);
  }
}

function seleccionarCalificacion(puntuacion) {
  calificacionActual = puntuacion;
  const estrellas = document.querySelectorAll('#rating-container .popcorn-star');
  estrellas.forEach((estrella, indice) => {
    if (indice < puntuacion) {
      estrella.classList.add('active');
    } else {
      estrella.classList.remove('active');
    }
  });
}

// 3. CARGAR DATOS DE VENTAS Y PRODUCTOS
async function cargarDatosVentas() {
  try {
    const res = await fetch('ventas.php');
    const data = await res.json();

    if (data.success) {
      productosDisponibles = data.productos || [];
      actualizarBarraPublica(data.total_vendidas || 0);

      if (usuarioSesion && usuarioSesion.rol === 'empleado') {
        renderizarBotoneraProductos();
      }
    }
  } catch (err) {
    console.error('Error al cargar ventas:', err);
  }
}

function actualizarBarraPublica(totalVendidas) {
  const meta = 100;
  const porcentaje = Math.min(Math.round((totalVendidas / meta) * 100), 100);
  
  const elTotal = document.getElementById('total-vendidas');
  const elBarra = document.getElementById('barra-pochoclos');

  if (elTotal) elTotal.textContent = totalVendidas;
  if (elBarra) {
    elBarra.style.width = `${porcentaje}%`;
    elBarra.textContent = `${porcentaje}%`;
  }
}

function renderizarBotoneraProductos() {
  const grid = document.getElementById('grid-productos');
  if (!grid) return;
  grid.innerHTML = '';

  const productosSimples = productosDisponibles.filter(p => p.tipo !== 'maletin');
  maletinesDisponibles = productosDisponibles.filter(p => p.tipo === 'maletin');

  productosSimples.forEach(prod => {
    grid.innerHTML += `
      <div style="border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; text-align: center; background: #fff;">
        <img src="img/${prod.tipo}.png" alt="${prod.tipo}" style="width: 80px; height: 80px; object-fit: contain;" onerror="this.src='img/default.png'">
        <div style="font-weight: bold; margin-top: 5px;">${prod.tipo.toUpperCase()}</div>
        <div style="color: #e11d48; font-weight: 600;">$${prod.precio}</div>
        <button class="btn btn-primary btn-block" style="margin-top: 8px;" onclick="registrarVentaDirecta(${prod.id})">🛒 Vender</button>
      </div>
    `;
  });

  if (maletinesDisponibles.length > 0) {
    grid.innerHTML += `
      <div style="border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; text-align: center; background: #fff;">
        <img src="img/maletin.png" alt="Maletín" style="width: 80px; height: 80px; object-fit: contain;" onerror="this.src='img/default.png'">
        <div style="font-weight: bold; margin-top: 5px;">MALETINES</div>
        <div style="color: #e11d48; font-weight: 600;">$${maletinesDisponibles[0].precio}</div>
        <button class="btn btn-primary btn-block" style="margin-top: 8px;" onclick="abrirModalMaletin()">🎒 Elegir Versión</button>
      </div>
    `;
  }
}

function abrirModalMaletin() {
  const select = document.getElementById('select-subtipo-maletin');
  if (!select) return;
  select.innerHTML = '';

  maletinesDisponibles.forEach(m => {
    select.innerHTML += `<option value="${m.id}">${m.subtipo} - $${m.precio}</option>`;
  });

  document.getElementById('modal-maletin').classList.remove('hidden');
}

function cerrarModalMaletin() {
  document.getElementById('modal-maletin').classList.add('hidden');
}

async function registrarVentaDirecta(productoId) {
  await enviarVentaBD(productoId, 1);
}

async function confirmarVentaMaletin() {
  const productoId = document.getElementById('select-subtipo-maletin').value;
  await enviarVentaBD(productoId, 1);
  cerrarModalMaletin();
}

async function enviarVentaBD(productoId, cantidad) {
  try {
    const res = await fetch('ventas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto_id: productoId, cantidad: cantidad, latitud: -36.53, longitud: -56.69 })
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      cargarDatosVentas();
    }
  } catch (err) {
    alert('Error al registrar la venta.');
  }
}

// 4. MODAL Y LOGIN
function abrirModalLogin() {
  document.getElementById('modal-login').classList.remove('hidden');
}

function cerrarModalLogin() {
  document.getElementById('modal-login').classList.add('hidden');
}

async function procesarLogin(e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try {
    const res = await fetch('login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      usuarioSesion = data;
      cerrarModalLogin();
      activarPanel(data.rol, data.nombre);
    } else {
      alert(data.message || 'Credenciales incorrectas.');
    }
  } catch (err) {
    alert('Error al conectar con el servidor.');
  }
}

function activarPanel(rol, nombre) {
  document.getElementById('vista-publica').classList.add('hidden');
  document.getElementById('btn-abrir-login').classList.add('hidden');

  const labelUser = document.getElementById('label-usuario');
  const btnCerrar = document.getElementById('btn-cerrar-sesion');
  labelUser.classList.remove('hidden');
  btnCerrar.classList.remove('hidden');

  if (rol === 'admin') {
    labelUser.textContent = `👑 Admin: ${nombre}`;
    document.getElementById('vista-admin').classList.remove('hidden');
    renderizarEmpleados();
  } else {
    labelUser.textContent = `🛒 Vendedor: ${nombre}`;
    document.getElementById('vista-empleado').classList.remove('hidden');
    cargarDatosVentas();
  }
}

function cerrarSesion() {
  usuarioSesion = null;
  document.getElementById('vista-admin').classList.add('hidden');
  document.getElementById('vista-empleado').classList.add('hidden');
  document.getElementById('label-usuario').classList.add('hidden');
  document.getElementById('btn-cerrar-sesion').classList.add('hidden');

  document.getElementById('vista-publica').classList.remove('hidden');
  document.getElementById('btn-abrir-login').classList.remove('hidden');
}

// 5. GESTIÓN DE EMPLEADOS (ADMIN)
async function renderizarEmpleados() {
  const lista = document.getElementById('tabla-empleados');
  if (!lista) return;

  try {
    const res = await fetch('empleados.php');
    const data = await res.json();

    if (data.success) {
      lista.innerHTML = '';
      if (data.empleados.length === 0) {
        lista.innerHTML = '<li style="color: #64748b;">No hay empleados registrados.</li>';
        return;
      }

      data.empleados.forEach(emp => {
        lista.innerHTML += `
          <li>
            <span>
              <strong>${emp.nombre} ${emp.apellido}</strong> - ${emp.email}<br>
              <small style="color: #64748b;">Carrito Asignado ID: ${emp.carrito_id || 'Sin asignación'}</small>
            </span>
            <button class="btn btn-danger" onclick="eliminarEmpleado(${emp.id})">Borrar</button>
          </li>
        `;
      });
    }
  } catch (err) {
    console.error('Error al cargar empleados:', err);
  }
}

async function crearEmpleado(e) {
  e.preventDefault();

  const nombre = document.getElementById('emp-nombre').value.trim();
  const apellido = document.getElementById('emp-apellido').value.trim();
  const email = document.getElementById('emp-email').value.trim();
  const password = document.getElementById('emp-password').value.trim();
  const carrito_id = document.getElementById('emp-carrito').value;

  try {
    const res = await fetch('empleados.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellido, email, password, carrito_id })
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ " + data.message);
      e.target.reset();
      renderizarEmpleados();
    } else {
      alert("⚠️ " + data.message);
    }
  } catch (err) {
    alert("❌ Error al conectar con el servidor.");
  }
}

async function eliminarEmpleado(id) {
  if (!confirm("¿Seguro que querés eliminar la cuenta de este empleado?")) return;

  try {
    const res = await fetch('empleados.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ " + data.message);
      renderizarEmpleados();
    } else {
      alert("⚠️ " + data.message);
    }
  } catch (err) {
    alert("❌ Error al procesar la eliminación.");
  }
}

// EFECTO POCHOCLOS
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

    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.setProperty('--dx', dx);
    p.style.setProperty('--dy', dy);
    p.style.setProperty('--rot', rot);

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  seleccionarCalificacion(5);
  cargarComentarios();
  cargarDatosVentas();
});