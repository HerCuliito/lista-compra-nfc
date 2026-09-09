import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [producto, setProducto] = useState('')
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)

  const categorias = [
    {
      nombre: 'Frutas y verduras',
      icono: '🥬',
      palabras: [
        'tomate',
        'tomates',
        'cebolla',
        'cebollas',
        'lechuga',
        'zanahoria',
        'zanahorias',
        'pimiento',
        'pimientos',
        'pepino',
        'pepinos',
        'calabacin',
        'calabacín',
        'berenjena',
        'berenjenas',
        'papas',
        'patatas',
        'aguacate',
        'aguacates',
        'platano',
        'plátano',
        'platanos',
        'plátanos',
        'manzana',
        'manzanas',
        'pera',
        'peras',
        'naranja',
        'naranjas',
        'limon',
        'limón',
        'limones',
        'fresa',
        'fresas',
        'uva',
        'uvas'
      ],
    },
    {
      nombre: 'Nevera',
      icono: '🧊',
      palabras: [
        'leche',
        'yogur',
        'yogures',
        'queso',
        'quesos',
        'mantequilla',
        'huevos',
        'huevo',
        'nata',
        'jamon',
        'jamón',
        'pavo',
        'fiambre',
        'mozzarella',
        'crema',
      ],
    },
    {
      nombre: 'Carne y pescado',
      icono: '🥩',
      palabras: [
        'pollo',
        'carne',
        'ternera',
        'cerdo',
        'hamburguesa',
        'hamburguesas',
        'salchichas',
        'pescado',
        'salmon',
        'salmón',
        'atun fresco',
        'atún fresco',
        'merluza',
        'bacalao',
        'gambas',
        'langostinos',
      ],
    },
    {
      nombre: 'Panadería',
      icono: '🥖',
      palabras: [
        'pan',
        'barra',
        'baguette',
        'croissant',
        'croissants',
        'bollos',
        'tortillas',
        'tortitas',
      ],
    },
    {
      nombre: 'Congelados',
      icono: '❄️',
      palabras: [
        'congelado',
        'congelados',
        'pizza',
        'pizzas',
        'helado',
        'helados',
        'croquetas',
        'nuggets',
      ],
    },
    {
      nombre: 'Bebidas',
      icono: '🥤',
      palabras: [
        'agua',
        'refresco',
        'refrescos',
        'zumo',
        'zumos',
        'cafe',
        'café',
        'te',
        'té',
        'cerveza',
        'vino',
      ],
    },
    {
      nombre: 'Limpieza',
      icono: '🧼',
      palabras: [
        'detergente',
        'lavavajillas',
        'lejia',
        'lejía',
        'suavizante',
        'fregasuelos',
        'limpiador',
        'esponja',
        'esponjas',
        'bolsas basura',
        'bolsa basura',
        'papel cocina',
      ],
    },
    {
      nombre: 'Higiene',
      icono: '🧴',
      palabras: [
        'champu',
        'champú',
        'gel',
        'jabón',
        'jabon',
        'desodorante',
        'pasta dientes',
        'dentifrico',
        'dentífrico',
        'papel higienico',
        'papel higiénico',
        'toallitas',
        'compresas',
        'tampones',
      ],
    },
    {
      nombre: 'Despensa',
      icono: '🥫',
      palabras: [
        'arroz',
        'pasta',
        'macarrones',
        'espaguetis',
        'lentejas',
        'garbanzos',
        'judias',
        'judías',
        'aceite',
        'vinagre',
        'sal',
        'azucar',
        'azúcar',
        'harina',
        'cereales',
        'galletas',
        'atun',
        'atún',
        'tomate frito',
        'mayonesa',
        'ketchup',
        'salsa',
        'chocolate',
        'cacao',
      ],
    },
  ]

  async function cargarLista() {
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .order('completed', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error al cargar:', error)
    } else {
      setLista(data)
    }

    setCargando(false)
  }

  useEffect(() => {
    cargarLista()

    const canal = supabase
      .channel('lista-compra-cambios')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
        },
        () => {
          cargarLista()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  function normalizarTexto(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  function obtenerCategoria(nombreProducto) {
    const texto = normalizarTexto(nombreProducto)

    for (const categoria of categorias) {
      const coincide = categoria.palabras.some((palabra) =>
        texto.includes(normalizarTexto(palabra))
      )

      if (coincide) {
        return categoria.nombre
      }
    }

    return 'Otros'
  }

  function obtenerIconoCategoria(nombreCategoria) {
    const categoria = categorias.find(
      (categoria) => categoria.nombre === nombreCategoria
    )

    return categoria?.icono || '📦'
  }

  const grupos = lista.reduce((resultado, item) => {
    const categoria = obtenerCategoria(item.name)

    if (!resultado[categoria]) {
      resultado[categoria] = []
    }

    resultado[categoria].push(item)

    return resultado
  }, {})

  const ordenCategorias = [
    'Frutas y verduras',
    'Nevera',
    'Carne y pescado',
    'Panadería',
    'Congelados',
    'Despensa',
    'Bebidas',
    'Limpieza',
    'Higiene',
    'Otros',
  ]

  async function añadirProducto() {
    const nombre = producto.trim()

    if (nombre === '') return

    const { error } = await supabase
      .from('shopping_items')
      .insert({
        name: nombre,
        quantity: 1,
        completed: false,
      })

    if (error) {
      console.error('Error al añadir:', error)
      alert('No se pudo añadir el producto.')
      return
    }

    setProducto('')
    await cargarLista()
  }

  async function cambiarCantidad(item, cambio) {
    const nuevaCantidad = Math.max(
      1,
      (item.quantity || 1) + cambio
    )

    if (nuevaCantidad === item.quantity) return

    const { error } = await supabase
      .from('shopping_items')
      .update({
        quantity: nuevaCantidad,
      })
      .eq('id', item.id)

    if (error) {
      console.error('Error al cambiar cantidad:', error)
      return
    }

    await cargarLista()
  }

  async function cambiarEstado(item) {
    const { error } = await supabase
      .from('shopping_items')
      .update({
        completed: !item.completed,
      })
      .eq('id', item.id)

    if (error) {
      console.error('Error al actualizar:', error)
      return
    }

    await cargarLista()
  }

  async function borrarProducto(id) {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error al borrar:', error)
      return
    }

    await cargarLista()
  }

  async function borrarCompra() {
    const comprados = lista.filter((item) => item.completed)

    if (comprados.length === 0) {
      alert('No hay productos marcados como comprados.')
      return
    }

    const confirmar = window.confirm(
      `¿Quieres borrar ${comprados.length} producto${
        comprados.length === 1 ? '' : 's'
      } de la compra?`
    )

    if (!confirmar) return

    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('completed', true)

    if (error) {
      console.error('Error al borrar la compra:', error)
      alert('No se pudo borrar la compra.')
      return
    }

    await cargarLista()
  }

  const hayComprados = lista.some((item) => item.completed)

  return (
    <main>
      <h1>🛒 Lista de la compra</h1>

      <div className="formulario">
        <input
          type="text"
          placeholder="Añadir producto..."
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              añadirProducto()
            }
          }}
        />

        <button onClick={añadirProducto}>
          Añadir
        </button>
      </div>

      {cargando ? (
        <p>Cargando lista...</p>
      ) : (
        <>
          <div className="lista">
            {ordenCategorias.map((nombreCategoria) => {
              const productos = grupos[nombreCategoria]

              if (!productos || productos.length === 0) {
                return null
              }

              return (
                <section
                  className="categoria"
                  key={nombreCategoria}
                >
                  <h2 className="categoria-titulo">
                    <span>
                      {obtenerIconoCategoria(nombreCategoria)}
                    </span>
                    {nombreCategoria}
                  </h2>

                  <div className="categoria-productos">
                    {productos.map((item) => (
                      <div
                        className="producto"
                        key={item.id}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() =>
                            cambiarEstado(item)
                          }
                        />

                        <span
                          className={
                            item.completed
                              ? 'comprado'
                              : ''
                          }
                        >
                          {item.name}
                        </span>

                        <div className="cantidad">
                          <button
                            onClick={() =>
                              cambiarCantidad(item, -1)
                            }
                            disabled={
                              (item.quantity || 1) <= 1
                            }
                          >
                            −
                          </button>

                          <span>
                            {item.quantity || 1}
                          </span>

                          <button
                            onClick={() =>
                              cambiarCantidad(item, 1)
                            }
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="borrar"
                          onClick={() =>
                            borrarProducto(item.id)
                          }
                          aria-label={`Borrar ${item.name}`}
                        >
                          Borrar
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>

          {hayComprados && (
            <button
              className="borrar-compra"
              onClick={borrarCompra}
            >
              Borrar compra
            </button>
          )}
        </>
      )}
    </main>
  )
}

export default App