let usuarioSesion = null;
let calificacionSeleccionada = 5;

// ======================================================
// EFECTO POCHOCLOS EN EL TÍTULO
// ======================================================

function explotarPochoclos(e) {

  const rect = e.target.getBoundingClientRect();

  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  for (let i = 0; i < 12; i++) {

    const p = document.createElement('div');

    p.className = 'popcorn-particle';
    p.textContent = '🍿';

    const dx =
      (Math.random() - 0.5) * 200 + 'px';

    const dy =
      -(Math.random() * 150 + 50) + 'px';

    const rot =
      (Math.random() - 0.5) * 360 + 'deg';

    p.style.left = x + 'px';
    p.style.top = y + 'px';

    p.style.setProperty(
      '--dx',
      dx
    );

    p.style.setProperty(
      '--dy',
      dy
    );

    p.style.setProperty(
      '--rot',
      rot
    );

    document.body.appendChild(p);

    setTimeout(() => {
      p.remove();
    }, 1200);
  }
}


// ======================================================
// MODAL DE LOGIN
// ======================================================

function abrirModalLogin() {

  const modal =
    document.getElementById('modal-login');

  if (modal) {
    modal.classList.remove('hidden');
  }
}


function cerrarModalLogin() {

  const modal =
    document.getElementById('modal-login');

  if (modal) {
    modal.classList.add('hidden');
  }
}


// ======================================================
// LOGIN MEDIANTE PHP
// ======================================================

async function procesarLogin(e) {

  e.preventDefault();

  const emailElement =
    document.getElementById('login-email');

  const passwordElement =
    document.getElementById('login-password');


  if (!emailElement || !passwordElement) {

    alert(
      '❌ No se encontraron los campos de inicio de sesión.'
    );

    return;
  }


  const email =
    emailElement.value.trim();

  const password =
    passwordElement.value.trim();


  if (!email || !password) {

    alert(
      '⚠️ Completá el email y la contraseña.'
    );

    return;
  }


  console.log('=== INICIO LOGIN ===');
  console.log('Email:', email);


  try {

    const res = await fetch(
      'login.php',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          email: email,
          password: password
        })
      }
    );


    console.log(
      'Estado HTTP:',
      res.status
    );


    const texto =
      await res.text();


    console.log(
      'Respuesta exacta de PHP:'
    );

    console.log(texto);


    let data;


    try {

      data =
        JSON.parse(texto);

    } catch (error) {

      console.error(
        'ERROR AL CONVERTIR JSON:',
        error
      );

      alert(
        '❌ PHP no está devolviendo JSON válido. Revisá la consola.'
      );

      return;
    }


    console.log(
      'Datos recibidos:',
      data
    );


    if (data.success) {

      console.log(
        'LOGIN CORRECTO'
      );

      console.log(
        'Rol:',
        data.rol
      );

      console.log(
        'Nombre:',
        data.nombre
      );


      usuarioSesion = data;


      cerrarModalLogin();


      activarPanel(
        data.rol,
        data.nombre
      );


    } else {

      console.log(
        'LOGIN RECHAZADO:',
        data.message
      );

      alert(
        data.message ||
        'Credenciales incorrectas.'
      );
    }


  } catch (err) {

    console.error(
      'ERROR REAL:',
      err
    );

    alert(
      '❌ Error al conectar con el servidor: ' +
      err.message
    );
  }
}


// ======================================================
// ACTIVAR PANEL SEGÚN EL ROL
// ======================================================

function activarPanel(rol, nombre) {

  const vistaPublica =
    document.getElementById(
      'vista-publica'
    );

  const btnAbrirLogin =
    document.getElementById(
      'btn-abrir-login'
    );

  const labelUsuario =
    document.getElementById(
      'label-usuario'
    );

  const btnCerrarSesion =
    document.getElementById(
      'btn-cerrar-sesion'
    );

  const vistaAdmin =
    document.getElementById(
      'vista-admin'
    );

  const vistaEmpleado =
    document.getElementById(
      'vista-empleado'
    );


  if (vistaPublica) {
    vistaPublica.classList.add(
      'hidden'
    );
  }


  if (btnAbrirLogin) {
    btnAbrirLogin.classList.add(
      'hidden'
    );
  }


  if (labelUsuario) {

    labelUsuario.classList.remove(
      'hidden'
    );

    if (rol === 'admin') {

      labelUsuario.textContent =
        `👑 Admin: ${nombre}`;

    } else {

      labelUsuario.textContent =
        `🛒 ${nombre}`;
    }
  }


  if (btnCerrarSesion) {

    btnCerrarSesion.classList.remove(
      'hidden'
    );
  }


  if (rol === 'admin') {

    if (vistaEmpleado) {
      vistaEmpleado.classList.add(
        'hidden'
      );
    }

    if (vistaAdmin) {

      vistaAdmin.classList.remove(
        'hidden'
      );

      renderizarEmpleados();
    }

  } else {

    if (vistaAdmin) {
      vistaAdmin.classList.add(
        'hidden'
      );
    }

    if (vistaEmpleado) {
      vistaEmpleado.classList.remove(
        'hidden'
      );
    }
  }
}


// ======================================================
// CERRAR SESIÓN
// ======================================================

function cerrarSesion() {

  usuarioSesion = null;


  const vistaAdmin =
    document.getElementById(
      'vista-admin'
    );

  const vistaEmpleado =
    document.getElementById(
      'vista-empleado'
    );

  const labelUsuario =
    document.getElementById(
      'label-usuario'
    );

  const btnCerrarSesion =
    document.getElementById(
      'btn-cerrar-sesion'
    );

  const vistaPublica =
    document.getElementById(
      'vista-publica'
    );

  const btnAbrirLogin =
    document.getElementById(
      'btn-abrir-login'
    );


  if (vistaAdmin) {
    vistaAdmin.classList.add(
      'hidden'
    );
  }


  if (vistaEmpleado) {
    vistaEmpleado.classList.add(
      'hidden'
    );
  }


  if (labelUsuario) {
    labelUsuario.classList.add(
      'hidden'
    );
  }


  if (btnCerrarSesion) {
    btnCerrarSesion.classList.add(
      'hidden'
    );
  }


  if (vistaPublica) {
    vistaPublica.classList.remove(
      'hidden'
    );
  }


  if (btnAbrirLogin) {
    btnAbrirLogin.classList.remove(
      'hidden'
    );
  }
}


// ======================================================
// GESTIÓN DE EMPLEADOS
// ======================================================

async function renderizarEmpleados() {

  const lista =
    document.getElementById(
      'tabla-empleados'
    );


  if (!lista) {
    return;
  }


  lista.innerHTML =
    '<li>Cargando empleados...</li>';


  try {

    const res =
      await fetch(
        'empleados.php'
      );


    const data =
      await res.json();


    if (data.success) {

      lista.innerHTML = '';


      if (
        !data.empleados ||
        data.empleados.length === 0
      ) {

        lista.innerHTML =
          '<li style="color: #64748b;">No hay empleados registrados.</li>';

        return;
      }


      data.empleados.forEach(
        emp => {

          lista.innerHTML += `

            <li>

              <span>

                <strong>
                  ${emp.nombre}
                  ${emp.apellido}
                </strong>

                -
                ${emp.email}

                <br>

                <small style="color: #64748b;">

                  Carrito Asignado ID:
                  ${emp.carrito_id || 'Sin asignación'}

                </small>

              </span>


              <button
                class="btn btn-danger"
                onclick="eliminarEmpleado(${emp.id})"
              >
                Borrar
              </button>

            </li>

          `;
        }
      );


    } else {

      lista.innerHTML =
        '<li style="color: #ef4444;">Error al obtener empleados.</li>';
    }


  } catch (err) {

    console.error(err);

    lista.innerHTML =
      '<li style="color: #ef4444;">Error de conexión con el servidor.</li>';
  }
}


// ======================================================
// CREAR EMPLEADO
// ======================================================

async function crearEmpleado(e) {

  e.preventDefault();


  const nombre =
    document
      .getElementById('emp-nombre')
      .value
      .trim();


  const apellido =
    document
      .getElementById('emp-apellido')
      .value
      .trim();


  const email =
    document
      .getElementById('emp-email')
      .value
      .trim();


  const password =
    document
      .getElementById('emp-password')
      .value
      .trim();


  const carrito_id =
    document
      .getElementById('emp-carrito')
      .value;


  if (
    !nombre ||
    !apellido ||
    !email ||
    !password ||
    !carrito_id
  ) {

    alert(
      '⚠️ Completá todos los campos.'
    );

    return;
  }


  try {

    const res =
      await fetch(
        'empleados.php',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            nombre,
            apellido,
            email,
            password,
            carrito_id
          })
        }
      );


    const data =
      await res.json();


    if (data.success) {

      alert(
        '✅ ' + data.message
      );


      e.target.reset();


      renderizarEmpleados();


    } else {

      alert(
        '⚠️ ' + data.message
      );
    }


  } catch (err) {

    console.error(err);

    alert(
      '❌ Error al conectar con el servidor.'
    );
  }
}


// ======================================================
// ELIMINAR EMPLEADO
// ======================================================

async function eliminarEmpleado(id) {

  if (
    !confirm(
      '¿Seguro que querés eliminar la cuenta de este empleado?'
    )
  ) {

    return;
  }


  try {

    const res =
      await fetch(
        'empleados.php',
        {
          method: 'DELETE',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            id: id
          })
        }
      );


    const data =
      await res.json();


    if (data.success) {

      alert(
        '✅ ' + data.message
      );


      renderizarEmpleados();


    } else {

      alert(
        '⚠️ ' + data.message
      );
    }


  } catch (err) {

    console.error(err);

    alert(
      '❌ Error al procesar la eliminación.'
    );
  }
}


// ======================================================
// SISTEMA DE CALIFICACIÓN POR POCHOCLOS
// ======================================================

function seleccionarCalificacion(valor) {

  calificacionSeleccionada =
    valor;


  const bolsitas =
    document.querySelectorAll(
      '#rating-container .popcorn-star'
    );


  bolsitas.forEach(
    (b, index) => {

      if (index < valor) {

        b.classList.add(
          'active'
        );

      } else {

        b.classList.remove(
          'active'
        );
      }
    }
  );
}


// ======================================================
// GUARDAR COMENTARIO
// ======================================================

function guardarComentario(e) {

  e.preventDefault();


  const nombre =
    document
      .getElementById('com-nombre')
      .value;


  const apellido =
    document
      .getElementById('com-apellido')
      .value;


  const texto =
    document
      .getElementById('com-texto')
      .value;


  const bolsitasStr =
    '🍿'.repeat(
      calificacionSeleccionada
    );


  const lista =
    document.getElementById(
      'lista-comentarios'
    );


  const nuevoComentario = `

    <div class="comment-item">

      <div class="comment-header">

        <span class="comment-author">
          ${nombre} ${apellido}
        </span>

        <span>
          ${bolsitasStr}
        </span>

      </div>

      <p
        style="
          font-size: 0.88rem;
          color: #334155;
        "
      >
        ${texto}
      </p>

    </div>

  `;


  if (lista) {

    lista.insertAdjacentHTML(
      'afterbegin',
      nuevoComentario
    );
  }


  e.target.reset();


  seleccionarCalificacion(5);
}


// ======================================================
// SISTEMA DE VENTAS
// ======================================================

async function registrarVenta(e) {

  e.preventDefault();


  // Obtener los elementos del formulario
  const productoElement =
    document.getElementById(
      'venta-producto'
    );


  const cantidadElement =
    document.getElementById(
      'venta-cantidad'
    );


  // Verificar que existan
  if (
    !productoElement ||
    !cantidadElement
  ) {

    alert(
      '❌ No se encontraron los campos de venta.'
    );

    return;
  }


  // Obtener valores
  const producto_id =
    parseInt(
      productoElement.value
    );


  const cantidad =
    parseInt(
      cantidadElement.value
    );


  // Validar producto
  if (
    !producto_id ||
    producto_id <= 0
  ) {

    alert(
      '⚠️ Seleccioná un producto.'
    );

    return;
  }


  // Validar cantidad
  if (
    !cantidad ||
    cantidad <= 0
  ) {

    alert(
      '⚠️ La cantidad debe ser mayor a 0.'
    );

    return;
  }


  console.log(
    '=== REGISTRANDO VENTA ==='
  );

  console.log(
    'Producto ID:',
    producto_id
  );

  console.log(
    'Cantidad:',
    cantidad
  );


  try {

    const res =
      await fetch(
        'ventas.php',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            producto_id:
              producto_id,

            cantidad:
              cantidad

          })
        }
      );


    console.log(
      'Estado HTTP:',
      res.status
    );


    // Primero obtenemos texto
    // para poder detectar errores PHP
    const texto =
      await res.text();


    console.log(
      'Respuesta de ventas.php:',
      texto
    );


    let data;


    try {

      data =
        JSON.parse(texto);

    } catch (error) {

      console.error(
        'Error convirtiendo respuesta a JSON:',
        error
      );


      alert(
        '❌ ventas.php no está devolviendo JSON válido.\n\nRevisá la consola del navegador.'
      );

      return;
    }


    // ==============================================
    // VENTA CORRECTA
    // ==============================================

    if (data.success) {

      alert(

        '✅ ' +
        data.message +

        '\n\nProducto: ' +
        data.producto +

        '\nCantidad: ' +
        data.cantidad +

        '\nCarrito: #' +
        data.carrito_id

      );


      // Limpiar formulario
      productoElement.value = '';

      cantidadElement.value = '1';


      console.log(
        'VENTA REGISTRADA CORRECTAMENTE'
      );


    } else {

      // ============================================
      // ERROR DE PHP
      // ============================================

      alert(
        '⚠️ ' +
        (
          data.message ||
          'No se pudo registrar la venta.'
        )
      );


      console.error(
        'Error informado por ventas.php:',
        data.message
      );
    }


  } catch (err) {

    console.error(
      'ERROR REAL:',
      err
    );


    alert(
      '❌ Error de conexión con ventas.php.\n\n' +
      err.message
    );
  }
}