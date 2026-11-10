let usuarioSesion = null;
let calificacionActual = 5;
let productosDisponibles = [];
const productosSeleccionados = new Map();
let anchoFranjasCalculado = 0;

function ajustarFranjasFondo() {
  const ancho = document.documentElement.clientWidth;
  if (!ancho || ancho === anchoFranjasCalculado) return;

  const cantidadFranjas = Math.max(3, 2 * Math.round((ancho / 64 - 1) / 2) + 1);
  document.documentElement.style.setProperty('--stripe-width', `${ancho / cantidadFranjas}px`);
  anchoFranjasCalculado = ancho;
}

ajustarFranjasFondo();
window.addEventListener('resize', ajustarFranjasFondo);
new ResizeObserver(ajustarFranjasFondo).observe(document.documentElement);

function mejorarEsteticaSelect(select) {
  const contenedor = document.createElement('div');
  contenedor.className = 'custom-select';
  select.parentNode.insertBefore(contenedor, select);
  contenedor.appendChild(select);

  const etiqueta = Array.from(document.querySelectorAll('label[for]'))
    .find(label => label.htmlFor === select.id);
  if (etiqueta && !etiqueta.id) etiqueta.id = `${select.id}-label`;

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'select-trigger form-control';
  boton.setAttribute('role', 'combobox');
  boton.setAttribute('aria-haspopup', 'listbox');
  boton.setAttribute('aria-expanded', 'false');
  boton.setAttribute('aria-controls', `${select.id}-opciones`);
  if (etiqueta) boton.setAttribute('aria-labelledby', etiqueta.id);
  else boton.setAttribute('aria-label', 'Seleccionar una opción');
  etiqueta?.addEventListener('click', event => {
    event.preventDefault();
    boton.focus();
  });

  const lista = document.createElement('div');
  lista.className = 'select-options';
  lista.id = `${select.id}-opciones`;
  lista.setAttribute('role', 'listbox');
  lista.hidden = true;

  select.classList.add('custom-select-native');
  select.setAttribute('aria-hidden', 'true');
  select.tabIndex = -1;
  contenedor.append(boton, lista);

  function sincronizarOpciones() {
    boton.textContent = select.selectedOptions[0]?.textContent || 'Seleccionar...';
    lista.replaceChildren();

    Array.from(select.options).forEach(opcion => {
      const elemento = document.createElement('button');
      elemento.type = 'button';
      elemento.className = 'select-option';
      elemento.setAttribute('role', 'option');
      elemento.setAttribute('aria-selected', String(opcion.selected));
      elemento.disabled = opcion.disabled;

      const texto = document.createElement('span');
      texto.textContent = opcion.textContent;
      const marca = document.createElement('span');
      marca.className = 'select-option-check';
      marca.setAttribute('aria-hidden', 'true');
      marca.textContent = '✓';
      elemento.append(texto, marca);

      elemento.addEventListener('click', () => {
        select.value = opcion.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        sincronizarOpciones();
        cerrarLista();
        boton.focus();
      });

      lista.appendChild(elemento);
    });
  }

  function cerrarLista() {
    lista.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
  }

  function abrirLista(focoSeleccionado = false) {
    lista.hidden = false;
    boton.setAttribute('aria-expanded', 'true');
    const espacioAbajo = window.innerHeight - contenedor.getBoundingClientRect().bottom;
    const espacioArriba = contenedor.getBoundingClientRect().top;
    lista.classList.toggle('opens-up', lista.offsetHeight > espacioAbajo && espacioArriba > espacioAbajo);
    const opciones = Array.from(lista.querySelectorAll('.select-option:not(:disabled)'));
    const seleccionada = opciones.find(option => option.getAttribute('aria-selected') === 'true');
    (focoSeleccionado ? seleccionada || opciones[0] : opciones[0])?.focus();
  }

  boton.addEventListener('click', () => {
    if (lista.hidden) abrirLista();
    else cerrarLista();
  });

  boton.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (lista.hidden) abrirLista(event.key === 'ArrowUp');
      else cerrarLista();
    } else if (event.key === 'Escape') {
      cerrarLista();
    }
  });

  lista.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      cerrarLista();
      return;
    }

    const opciones = Array.from(lista.querySelectorAll('.select-option:not(:disabled)'));
    const indice = opciones.indexOf(document.activeElement);
    let destino;

    if (event.key === 'ArrowDown') destino = (indice + 1) % opciones.length;
    else if (event.key === 'ArrowUp') destino = (indice - 1 + opciones.length) % opciones.length;
    else if (event.key === 'Home') destino = 0;
    else if (event.key === 'End') destino = opciones.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      cerrarLista();
      boton.focus();
      return;
    } else {
      return;
    }

    event.preventDefault();
    opciones[destino]?.focus();
  });

  select.addEventListener('change', sincronizarOpciones);
  new MutationObserver(sincronizarOpciones).observe(select, { childList: true });
  select.form?.addEventListener('reset', () => setTimeout(sincronizarOpciones));
  document.addEventListener('pointerdown', event => {
    if (!contenedor.contains(event.target)) cerrarLista();
  });
  document.addEventListener('focusin', event => {
    if (!contenedor.contains(event.target)) cerrarLista();
  });

  sincronizarOpciones();
}

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

function renderizarBotoneraProductos() {
  const grid = document.getElementById('grid-productos');
  if (!grid) return;
  grid.innerHTML = '';

  productosDisponibles.forEach(prod => {
    const nombre = prod.tipo === 'maletin' ? `Maletín ${prod.subtipo}` : prod.tipo;
    const imagen = obtenerImagenProducto(prod);
    grid.innerHTML += `
      <div class="product-btn${productosSeleccionados.has(String(prod.id)) ? ' active' : ''}" data-value="${prod.id}" onclick="seleccionarProducto(${prod.id}, this)">
        <img src="${imagen}" alt="${nombre}" onerror="this.onerror=null; this.style.display='none';">
        <span>${nombre}</span>
        <small>$${prod.precio}</small>
      </div>
    `;
  });
}

function obtenerImagenProducto(producto) {
  if (producto.tipo === 'bolsa') return 'imagenes/bolsa_media.jpg';
  if (producto.tipo === 'caja') return 'imagenes/caja.jpg';

  const subtipo = String(producto.subtipo || '').toLowerCase().replace(/[^a-z]/g, '');
  const nombreArchivo = subtipo === 'dragonball' ? 'dragon_ball' : subtipo;
  return `imagenes/maletin_${nombreArchivo}.jpeg`;
}

function seleccionarProducto(id, elemento) {
  const productoId = String(id);
  if (productosSeleccionados.has(productoId)) {
    productosSeleccionados.delete(productoId);
  } else {
    const producto = productosDisponibles.find(prod => String(prod.id) === productoId);
    if (!producto) return;
    productosSeleccionados.set(productoId, { producto, cantidad: 1 });
  }

  elemento.classList.toggle('active', productosSeleccionados.has(productoId));
  renderizarProductosSeleccionados();
}

function renderizarProductosSeleccionados() {
  const contenedor = document.getElementById('productos-seleccionados');
  if (!contenedor) return;

  contenedor.replaceChildren();
  if (productosSeleccionados.size === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'selected-products-empty';
    vacio.textContent = 'Todavía no seleccionaste productos.';
    contenedor.appendChild(vacio);
    return;
  }

  productosSeleccionados.forEach(({ producto, cantidad }, productoId) => {
    const nombre = producto.tipo === 'maletin' ? `Maletín ${producto.subtipo}` : producto.tipo;
    const fila = document.createElement('div');
    fila.className = 'selected-product';

    const imagen = document.createElement('img');
    imagen.src = obtenerImagenProducto(producto);
    imagen.alt = nombre;
    imagen.onerror = () => {
      imagen.onerror = null;
      imagen.style.visibility = 'hidden';
    };

    const etiqueta = document.createElement('span');
    etiqueta.className = 'selected-product-name';
    etiqueta.textContent = nombre;

    const cantidadInput = document.createElement('input');
    cantidadInput.type = 'number';
    cantidadInput.className = 'form-control selected-product-quantity';
    cantidadInput.min = '1';
    cantidadInput.step = '1';
    cantidadInput.value = cantidad;
    cantidadInput.required = true;
    cantidadInput.setAttribute('aria-label', `Unidades de ${nombre}`);
    cantidadInput.addEventListener('change', () => {
      const nuevaCantidad = Number(cantidadInput.value);
      if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 1) {
        cantidadInput.value = cantidad;
        return;
      }
      productosSeleccionados.get(productoId).cantidad = nuevaCantidad;
    });

    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'selected-product-remove';
    quitar.textContent = '×';
    quitar.title = `Quitar ${nombre}`;
    quitar.setAttribute('aria-label', `Quitar ${nombre}`);
    quitar.addEventListener('click', () => {
      productosSeleccionados.delete(productoId);
      document.querySelector(`#grid-productos .product-btn[data-value="${productoId}"]`)?.classList.remove('active');
      renderizarProductosSeleccionados();
    });

    fila.append(imagen, etiqueta, cantidadInput, quitar);
    contenedor.appendChild(fila);
  });
}

async function registrarVenta(evento) {
  evento.preventDefault();

  if (productosSeleccionados.size === 0) {
    alert('Seleccioná al menos un producto antes de confirmar la venta.');
    return;
  }

  const selecciones = Array.from(productosSeleccionados.entries());
  if (selecciones.some(([, seleccion]) => !Number.isInteger(seleccion.cantidad) || seleccion.cantidad < 1)) {
    alert('Cada producto debe tener una cantidad válida de 1 o más.');
    return;
  }

  let registradas = 0;
  for (const [productoId, seleccion] of selecciones) {
    const resultado = await enviarVentaBD(productoId, seleccion.cantidad);
    if (resultado.success) {
      productosSeleccionados.delete(productoId);
      document.querySelector(`#grid-productos .product-btn[data-value="${productoId}"]`)?.classList.remove('active');
      registradas++;
    }
  }

  renderizarProductosSeleccionados();
  if (registradas === selecciones.length) {
    alert(`Se registraron ${registradas} producto(s) correctamente.`);
  } else {
    alert(`Se registraron ${registradas} de ${selecciones.length} productos. Los pendientes siguen seleccionados para reintentar.`);
  }
  if (registradas > 0) cargarDatosVentas();
}

async function enviarVentaBD(productoId, cantidad) {
  try {
    const res = await fetch('ventas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto_id: productoId, cantidad: cantidad, latitud: -36.53, longitud: -56.69 })
    });

    const data = await res.json();
    return { success: Boolean(data.success) };
  } catch (err) {
    return { success: false };
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
  const rect = e.currentTarget.getBoundingClientRect();
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
  document.querySelectorAll('select.form-control').forEach(mejorarEsteticaSelect);
  seleccionarCalificacion(5);
  cargarComentarios();
  cargarDatosVentas();
  cargarGraficoVentas();
});
