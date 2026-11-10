let usuarioSesion = null;
let calificacionActual = 5;
let productosDisponibles = [];

// 1. CARGAR RESEÑAS / COMENTARIOS DESDE LA BD
async function cargarComentarios() {
  const lista = document.getElementById('lista-comentarios');
  if (!lista) return;

  try {
    const respuesta = await fetch('resenas.php');
    const datos = await respuesta.json();

    if (!datos.success) {
      lista.innerHTML = '<p style="color: #64748b;">Todavía no hay comentarios publicados.</p>';
      return;
    }

    lista.innerHTML = '';

    if (!datos.resenas || datos.resenas.length === 0) {
      lista.innerHTML = '<p style="color: #64748b;">Todavía no hay comentarios. ¡Sé el primero en opinar!</p>';
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

    const datos = await respuesta.json();

    if (datos.success) {
      alert('✅ ' + datos.message);
      document.getElementById('form-comentario').reset();
      seleccionarCalificacion(5);
      await cargarComentarios();
    } else {
      alert('⚠️ ' + datos.message);
    }
  } catch (error) {
    console.error('Error al guardar comentario:', error);
    alert('❌ Error al conectar con el servidor.');
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
      const totalMostrar = Number(data.total_vendidas) || 0;
      actualizarBarraPublica(totalMostrar);

      if (usuarioSesion && (usuarioSesion.rol === 'empleado' || usuarioSesion.rol === 'vendedor')) {
        renderizarBotoneraProductos();
      }
    } else {
      actualizarBarraPublica(0);
    }
  } catch (err) {
    console.error('Error al cargar ventas:', err);
    actualizarBarraPublica(0);
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

// Productos seleccionados para la venta: { productoId: cantidad }
let productosSeleccionados = {};

function renderizarBotoneraProductos() {
  const grid = document.getElementById('grid-productos');
  if (!grid) return;
  grid.innerHTML = '';

  productosDisponibles.forEach(prod => {
    const nombre = prod.tipo === 'maletin' ? `Maletín ${prod.subtipo}` : prod.tipo;
    const imagen = obtenerImagenProducto(prod);
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'product-btn' + (productosSeleccionados[prod.id] ? ' active' : '');
    boton.dataset.value = prod.id;
    boton.innerHTML = `
      <img src="${imagen}" alt="${nombre}" onerror="this.onerror=null; this.style.display='none';">
      <span>${nombre}</span>
      <small>$${prod.precio}</small>
    `;
    boton.addEventListener('click', () => seleccionarProducto(Number(prod.id)));
    grid.appendChild(boton);
  });

  renderizarCantidadesProductos();
}

function obtenerImagenProducto(producto) {
  if (producto.tipo === 'bolsa') return 'imagenes/bolsa_media.jpg';
  if (producto.tipo === 'caja') return 'imagenes/caja.jpg';

  const subtipo = String(producto.subtipo || '').toLowerCase().replace(/[^a-z]/g, '');
  const nombreArchivo = subtipo === 'dragonball' ? 'dragon_ball' : subtipo;
  return `imagenes/maletin_${nombreArchivo}.jpeg`;
}

function seleccionarProducto(id) {
  if (productosSeleccionados[id]) {
    delete productosSeleccionados[id];
  } else {
    productosSeleccionados[id] = 1;
  }

  const boton = document.querySelector(`#grid-productos .product-btn[data-value="${id}"]`);
  if (boton) boton.classList.toggle('active', Boolean(productosSeleccionados[id]));
  renderizarCantidadesProductos();
}

function renderizarCantidadesProductos() {
  const contenedor = document.getElementById('productos-seleccionados');
  if (!contenedor) return;

  const seleccionados = productosDisponibles.filter(prod => productosSeleccionados[prod.id]);
  if (seleccionados.length === 0) {
    contenedor.innerHTML = '<p class="empty-selection">Todavía no seleccionaste productos.</p>';
    return;
  }

  contenedor.innerHTML = '<h3 class="selected-products-title">Cantidades por producto</h3>';
  seleccionados.forEach(prod => {
    const nombre = prod.tipo === 'maletin' ? `Maletín ${prod.subtipo}` : prod.tipo;
    const grupo = document.createElement('div');
    grupo.className = 'selected-product-row';
    grupo.innerHTML = `
      <div class="selected-product-info">
        <strong>${nombre}</strong>
        <small>$${Number(prod.precio).toLocaleString('es-AR')} por unidad</small>
      </div>
      <label for="cantidad-producto-${prod.id}">Cantidad</label>
      <input
        type="number"
        id="cantidad-producto-${prod.id}"
        class="form-control selected-quantity"
        min="1"
        step="1"
        value="${productosSeleccionados[prod.id]}"
        required
        onchange="actualizarCantidadProducto(${prod.id}, this.value)"
        oninput="actualizarCantidadProducto(${prod.id}, this.value)"
      >
    `;
    contenedor.appendChild(grupo);
  });
}

function actualizarCantidadProducto(id, valor) {
  productosSeleccionados[id] = valor;
}

async function registrarVenta(evento) {
  evento.preventDefault();

  const items = Object.entries(productosSeleccionados).map(([producto_id, cantidad]) => ({
    producto_id: Number(producto_id),
    cantidad: Number(cantidad)
  }));

  if (items.length === 0) {
    alert('Seleccioná al menos un producto antes de confirmar la venta.');
    return;
  }

  if (items.some(item => !Number.isInteger(item.cantidad) || item.cantidad < 1)) {
    alert('Revisá las cantidades: todos los productos deben tener una cantidad válida.');
    return;
  }

  await enviarVentaBD(items);
}

async function enviarVentaBD(items) {
  try {
    const res = await fetch('ventas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        latitud: -36.53,
        longitud: -56.69
      })
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      productosSeleccionados = {};
      renderizarBotoneraProductos();
      await cargarDatosVentas();
    }
  } catch (err) {
    console.error('Error al registrar la venta:', err);
    alert('Error al registrar la venta. Verificá la conexión con el servidor.');
  }
}

let carritosCargados = false;

async function cargarGraficoVentas() {
  const selector = document.getElementById('filtro-carrito-grafico');
  const contenedor = document.getElementById('chart-5-dias');
  if (!contenedor) return;

  const carritoId = selector ? selector.value : 'todos';

  try {
    const respuesta = await fetch(`estadisticas_ventas.php?carrito_id=${carritoId}`);
    const datos = await respuesta.json();
    if (!datos.success) throw new Error('No se pudieron cargar las ventas.');

    if (selector && !carritosCargados) {
      selector.innerHTML = '<option value="todos">Todos los carritos</option>';
      datos.carritos.forEach(carrito => {
        const opcion = document.createElement('option');
        opcion.value = carrito.id;
        opcion.textContent = `${carrito.nombre} (${carrito.ubicacion})`;
        selector.appendChild(opcion);
      });
      carritosCargados = true;
    }

    contenedor.innerHTML = '';
    datos.datos.forEach(dia => {
      const porcentaje = dia.total === 0 ? 8 : Math.round((dia.total / datos.max_ventas) * 100);
      const grupo = document.createElement('div');
      grupo.className = `chart-bar-group${dia.es_hoy ? ' active' : ''}`;
      grupo.innerHTML = `
        <span class="chart-value">${dia.total}</span>
        <div class="chart-bar" style="height: ${porcentaje}%;"></div>
        <span class="chart-label">${dia.etiqueta}</span>
      `;
      contenedor.appendChild(grupo);
    });
  } catch (error) {
    console.error('Error al cargar el gráfico de ventas:', error);
    contenedor.innerHTML = '<p style="margin: auto; color: var(--red-pop); font-weight: 800;">No se pudieron cargar las ventas.</p>';
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

// EFECTO POCHOCLOS VOLADORES
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
  cargarGraficoVentas();
});
