// Textos de la web en español (por defecto, en la raíz), inglés, neerlandés
// y alemán (en /en, /nl y /de). Cada idioma se exporta en su propio HTML.
// En alemán se trata de «Sie», como en el Impressum y el Datenschutz; en
// neerlandés, de «je».
// Los saltos de línea (\n) en los titulares son cortes intencionados.

const es = {
  "a11y": {
    "language": "Idioma",
    "nav": "Principal",
    "menu": "Menú de navegación",
    "home": "inicio"
  },
  "nav": [
    {
      "label": "Servicios",
      "href": "/servicios"
    },
    {
      "label": "Estudio",
      "href": "/estudio"
    },
    {
      "label": "Contacto",
      "href": "/contacto"
    }
  ],
  "cta": "Empezar un proyecto",
  "skip": "Saltar al contenido",
  "common": {
    "disciplines": [
      "Diseño",
      "Desarrollo",
      "SEO",
      "Asistente IA"
    ],
    "positioning": "Webs premium y crecimiento orgánico",
    "scroll": "Scroll",
    "perMonth": "/mes",
    "oncePayment": "pago único",
    "priceFrom": "desde",
    "overview": "El servicio",
    "customPrice": "Precio personalizado",
    "recommended": "Recomendado",
    "customPriceNote": "según los minutos que necesites",
    "seePlans": "Ver planes",
    "otherServices": "Otros servicios"
  },
  "hero": {
    "eyebrow": "Estudio digital independiente",
    "headline": "Una web mejor\nes solo el principio.",
    "support": "Diseñamos y programamos webs a medida, y después trabajamos para que te encuentren. Para negocios a los que su web actual se les ha quedado pequeña.",
    "tagline": "Pensadas para que te encuentren y te escriban.",
    "secondary": "Ver servicios"
  },
  "cases": {
    "eyebrow": "Casos de uso",
    "title": "Problemas reales,\nresueltos a medida.",
    "lead": "Cada caso cuenta un negocio, lo que le frenaba y qué hicimos. Solo publicamos casos reales.",
    "pending": "Pendiente",
    "problem": "El reto",
    "solution": "Qué hicimos",
    "items": [
      {
        "sector": "Sector pendiente",
        "title": "Caso pendiente de publicar",
        "problem": "Pendiente: qué le pasaba al negocio y por qué su web no le ayudaba.",
        "solution": "Pendiente: qué hicimos y qué cambió, con datos reales.",
        "services": [],
        "pending": true
      },
      {
        "sector": "Sector pendiente",
        "title": "Caso pendiente de publicar",
        "problem": "Pendiente: qué le pasaba al negocio y por qué su web no le ayudaba.",
        "solution": "Pendiente: qué hicimos y qué cambió, con datos reales.",
        "services": [],
        "pending": true
      },
      {
        "sector": "Sector pendiente",
        "title": "Caso pendiente de publicar",
        "problem": "Pendiente: qué le pasaba al negocio y por qué su web no le ayudaba.",
        "solution": "Pendiente: qué hicimos y qué cambió, con datos reales.",
        "services": [],
        "pending": true
      }
    ] as { sector: string; title: string; problem: string; solution: string; services: string[]; pending: boolean }[]
  },
  "services": {
    "eyebrow": "Qué hacemos",
    "title": "Cuatro servicios,\nun solo estudio.",
    "all": "Ver todos los servicios"
  },
  "approach": {
    "eyebrow": "Cómo trabajamos",
    "title": "No empezamos\npor el código.",
    "items": [
      {
        "title": "Entender",
        "body": "Miramos qué hay, qué funciona y qué está roto. Lo ponemos por escrito antes de proponer nada."
      },
      {
        "title": "Dirigir",
        "body": "Elegimos estructura, tipografía, color y tono, y te explicamos por qué. Te proponemos una sola dirección, no tres para que elijas."
      },
      {
        "title": "Construir",
        "body": "Diseñamos y programamos a la vez, así que ves la web funcionando desde las primeras semanas.",
        "service": "web"
      },
      {
        "title": "Crecer",
        "body": "Cuando la web sale, seguimos: medimos qué pasa, corregimos lo que no funciona y trabajamos el SEO y el contenido para que te encuentre más gente.",
        "service": "seo"
      }
    ] as { title: string; body: string; service?: string }[],
    "link": "Ver cómo trabajamos",
    "root": ["Qué hay", "Qué falta", "El tono"]
  },
  "studioHome": {
    "eyebrow": "Estudio",
    "title": "Un estudio pequeño,\npor decisión.",
    "lead": "Aterna es un estudio digital independiente. Somos pocos a propósito: así podemos llevar cada proyecto en persona.",
    "link": "Conocer el estudio",
    "pillars": [
      {
        "title": "Quien diseña, programa",
        "body": "La misma persona diseña tu web, la construye y te atiende. Nada se pierde entre equipos."
      },
      {
        "title": "El código es tuyo",
        "body": "Sin plantillas ni plugins que actualizar cada mes. Se lee, y cualquier otro estudio puede continuarlo."
      },
      {
        "title": "Pocos proyectos a la vez",
        "body": "Aceptamos pocos encargos a la vez, así que tu proyecto no espera en la cola detrás de otros diez."
      }
    ]
  },
  "finalCta": {
    "eyebrow": "Contacto",
    "mailLabel": "O escríbenos directamente",
    "title": "Si tu web ya no\nrepresenta a tu negocio,\nhablemos.",
    "lead": "Cuéntanos a qué te dedicas y qué esperas de tu web.",
    "nextTitle": "Qué pasa después",
    "next": [
      {
        "title": "Nos escribes",
        "body": "Con lo que tengas: qué hay ahora y para cuándo. No hace falta un briefing."
      },
      {
        "title": "Te respondemos",
        "body": "Siempre, aunque sea para decir que no somos el estudio adecuado. Si no encaja, lo decimos pronto."
      },
      {
        "title": "Lo ponemos por escrito",
        "body": "Una propuesta con qué haríamos, en qué plazo y por cuánto, antes de empezar nada."
      }
    ],
    "availability": "Agenda limitada: pregunta por fechas y te decimos."
  },
  "mobile": {
    "open": "Menú",
    "close": "Cerrar"
  },
  "copyEmail": {
    "copy": "Copiar",
    "copied": "Copiado"
  },
  "contactForm": {
    "name": "Nombre",
    "email": "Email",
    "message": "Mensaje",
    "submit": "Enviar mensaje",
    "sending": "Enviando…",
    "sent": "✓ Mensaje enviado. Te responderemos en cuanto lo leamos.",
    "error": "No se ha podido enviar. Prueba de nuevo o escríbenos por email.",
    "idle": "Respondemos a todo, aunque sea para decir que no somos el estudio adecuado.",
    "consentLegend": "Acuerdo RGPD",
    "consentText": "Doy mi consentimiento para que esta web almacene la información que envío para que puedan responder a mi petición.",
    "consentMore": "Más información en la",
    "consentLink": "política de privacidad",
    "consentHref": "/legal#privacidad"
  },
  "whatsapp": {
    "message": "Hola, quiero más información sobre Aterna Studio.",
    "aria": "Escribir por WhatsApp"
  },
  "assistant": {
    "open": "Abrir el asistente de Aterna",
    "close": "Cerrar el asistente",
    "title": "Asistente de Aterna",
    "note": "Responde con lo que dice esta web. Para algo concreto, escríbenos.",
    "placeholder": "Pregunta lo que quieras…",
    "send": "Enviar",
    "labels": ["Pensando", "Buscando", "Leyendo la web", "Redactando"],
    "answer": "Respuesta",
    "restart": "Empezar de nuevo",
    "suggestions": ["¿Cuánto cuesta una web?", "¿Qué incluye el SEO?", "¿Cómo trabajáis?", "¿Cómo os contacto?"],
    "hello": "¡Hola! Soy el asistente de Aterna. Te cuento lo que hacemos, cuánto cuesta y cómo trabajamos. ¿Qué quieres saber?",
    "fallback": "Eso no lo encuentro en la web y prefiero no inventármelo. Escríbenos y te respondemos nosotros.",
    "contactLink": "Escribirnos",
    "plansIntro": "Planes de {service}:",
    "custom": "precio personalizado",
    "studioLink": "Conocer el estudio",
    "methodLink": "Ver cómo trabajamos",
    "plansLabel": "Planes de {service}",
    "contactLabel": "¿Cómo os contacto?",
    "nearest": "Quizá te sirva alguna de estas:",
    "askWhatsApp": "Preguntar por WhatsApp",
    "question": "Hola, tengo una pregunta: {q}",
    "flow": {
      "start": "Ayúdame a elegir",
      "need": {
        "q": "¿Qué te hace falta?",
        "options": [
          {
            "label": "Una web nueva o renovar la mía",
            "service": "web"
          },
          {
            "label": "Que me encuentren en Google",
            "service": "seo"
          },
          {
            "label": "Que alguien cuide mi web",
            "service": "mantenimiento"
          },
          {
            "label": "Atender las llamadas",
            "service": "asistente-ia"
          },
          {
            "label": "Aún no lo sé",
            "service": ""
          }
        ]
      },
      "sector": {
        "q": "¿A qué se dedica tu negocio?",
        "options": [
          "Restaurante o cafetería",
          "Tienda",
          "Salud o bienestar",
          "Servicios profesionales",
          "Otra cosa"
        ]
      },
      "when": {
        "q": "¿Para cuándo lo necesitas?",
        "options": [
          "Lo antes posible",
          "En los próximos meses",
          "Solo estoy mirando"
        ]
      },
      "summary": "Te encaja esto: {service}, {price}. Te dejo el mensaje preparado: mándalo por WhatsApp o por el formulario y te contestamos con una propuesta.",
      "summaryUnsure": "Lo vemos juntos. Te dejo el mensaje preparado: mándalo por WhatsApp o por el formulario y te contamos qué haríamos en tu caso.",
      "intro": "Hola, vengo del asistente de la web.",
      "fields": {
        "service": "Me interesa",
        "sector": "Sector",
        "when": "Plazo"
      },
      "unsure": "aún no lo sé",
      "whatsapp": "Enviar por WhatsApp",
      "form": "Usar el formulario"
    }
  },
  "servicePages": {
    "index": {
      "eyebrow": "Servicios",
      "h1": "Cuatro formas\nde trabajar juntos.",
      "lead": "Diseñamos y construimos tu web, la mantenemos viva, hacemos que te encuentren y atendemos tus llamadas cuando tú no puedes. Empieza por una y suma las demás cuando quieras.",
      "cards": [
        {
          "slug": "web",
          "kicker": "Pago único",
          "title": "Diseño y desarrollo web",
          "body": "Una web hecha para tu negocio y no para cualquiera. Diseño, dirección de arte y código propio.",
          "cta": "Ver diseño web"
        },
        {
          "slug": "seo",
          "kicker": "Cuota mensual",
          "title": "SEO y crecimiento orgánico",
          "body": "Que te encuentre la gente que ya busca lo que ofreces. Trabajo mensual, con un informe claro de lo que cambia.",
          "cta": "Ver SEO"
        },
        {
          "slug": "mantenimiento",
          "kicker": "Cuota mensual",
          "title": "Mantenimiento y soporte",
          "body": "Nos ocupamos del hosting, las copias y las actualizaciones para que tú no tengas que pensar en ello.",
          "cta": "Ver mantenimiento"
        },
        {
          "slug": "asistente-ia",
          "kicker": "Cuota mensual",
          "title": "Asistente telefónico con IA",
          "body": "Un asistente de voz que contesta las llamadas de tu negocio las 24 horas, también cuando estás ocupado o ya has cerrado.",
          "cta": "Ver asistente IA"
        }
      ]
    },
    "web": {
      "eyebrow": "Diseño y desarrollo web · Pago único",
      "h1": "Una web que se parezca\na tu negocio.",
      "lead": "Diseño, dirección de arte y desarrollo web a medida, sin plantillas ni plugins que mantener. Al terminar, el código es tuyo.",
      "intro": [
        "Muchas webs se parecen porque salen del mismo puñado de plantillas. Nosotros empezamos por otra pregunta: qué tiene que conseguir la tuya. Que te encuentren, que te reserven, que te compren. Con eso claro, decidimos la estructura, la dirección de arte y el código."
      ],
      "includesTitle": "Qué incluye",
      "includes": [
        "Auditoría y estrategia antes de diseñar nada",
        "Dirección de arte a medida: tipografía, color, imagen y tono",
        "Diseño de la experiencia completa, de escritorio a móvil",
        "Código propio, rápido y accesible (Core Web Vitals como objetivo)",
        "SEO técnico de base y datos estructurados",
        "Publicación, pruebas y entrega del código"
      ],
      "reportTitle": "",
      "report": "",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Planes",
      "plansNote": "Precio orientativo según alcance. IVA no incluido.",
      "plans": [
        {
          "name": "Esencial",
          "tagline": "Una web de una página o de pocas secciones, para empezar bien.",
          "features": [
            "Hasta 3 secciones",
            "Diseño a medida",
            "Formulario de contacto",
            "Responsive y accesible"
          ],
          "featured": false
        },
        {
          "name": "A medida",
          "tagline": "La que más hacemos: una web completa de varias páginas.",
          "features": [
            "Páginas a medida sin límite fijo",
            "Dirección de arte completa",
            "Motion e interacción donde aporta",
            "SEO técnico + datos estructurados"
          ],
          "featured": true
        },
        {
          "name": "Premium",
          "tagline": "Para cuando la web tiene que hacer más cosas.",
          "features": [
            "Multi-idioma",
            "Reservas o tienda",
            "Experiencias 3D / motion avanzado",
            "Todo lo anterior"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Preguntas frecuentes",
      "faq": [
        {
          "q": "¿Cuánto tarda?",
          "a": "Depende del alcance, pero una web a medida suele estar entre 3 y 6 semanas desde que tenemos el contenido. Te damos un calendario antes de empezar."
        },
        {
          "q": "¿El código es mío?",
          "a": "Sí. Te entregamos el código y es tuyo. Está escrito para que otro estudio pueda seguir con él si algún día cambias de proveedor."
        },
        {
          "q": "¿Incluye el mantenimiento?",
          "a": "El mantenimiento (hosting, copias, actualizaciones, soporte) es un servicio aparte y opcional. Puedes contratarlo o llevar la web por tu cuenta."
        }
      ]
    },
    "seo": {
      "eyebrow": "SEO y crecimiento orgánico · Cuota mensual",
      "h1": "SEO y crecimiento orgánico\npara negocios locales.",
      "lead": "Puedes tener una web estupenda, pero si nadie la encuentra no te sirve de mucho. El SEO se ocupa de que aparezcas cuando alguien busca lo que haces.",
      "intro": [
        "Te prometemos trabajo hecho cada mes y contado con claridad. El SEO no sube en línea recta, va a saltos, y lo verás mes a mes con datos reales.",
        "Trabajamos el crecimiento orgánico sobre todo en visibilidad local: hoteles, bodegas, restaurantes y cualquier negocio que depende de salir en las búsquedas «cerca de mí»."
      ],
      "includesTitle": "En qué trabajamos cada mes",
      "includes": [
        "SEO técnico y salud del sitio",
        "Búsquedas e intención (keyword research)",
        "Optimización on-page y contenido",
        "Visibilidad local y Google Business Profile",
        "Enlazado interno y autoridad",
        "Medición, informe y siguientes pasos"
      ],
      "reportTitle": "Nuestra forma de informar",
      "report": "Cada mes te mandamos el mismo esquema, también cuando el mes ha sido flojo: qué encontramos, qué hicimos, qué cambió, qué no y qué vamos a probar ahora.",
      "examplesTitle": "Un ejemplo de lo que recibes",
      "examplesLead": "Así son la auditoría y el informe que preparamos, en dos sectores distintos:",
      "examples": [
        {
          "label": "Empresa de reformas",
          "title": "Solera Reformas",
          "href": "/ejemplos/reformas-sevilla/"
        },
        {
          "label": "Asesoría fiscal",
          "title": "Nexo Asesores",
          "href": "/ejemplos/nexo-asesores/"
        }
      ],
      "plansTitle": "Planes",
      "plansNote": "Cuota mensual, permanencia mínima de 3 meses. IVA no incluido. Puedes cancelar cuando quieras: la web sigue siendo tuya.",
      "plans": [
        {
          "name": "Cuidado",
          "tagline": "Para cuidar lo que ya tienes e ir subiendo poco a poco.",
          "features": [
            "Google Business Profile",
            "SEO técnico y monitorización",
            "1 contenido al mes",
            "Informe mensual"
          ],
          "featured": false
        },
        {
          "name": "Crecimiento",
          "tagline": "Para ganar posiciones en tu zona mes a mes.",
          "features": [
            "Todo lo de Cuidado",
            "Páginas de zona y servicio",
            "Más contenido y reseñas",
            "Datos estructurados avanzados"
          ],
          "featured": true
        },
        {
          "name": "Dominio",
          "tagline": "Para ser el primer nombre que sale en tu comarca.",
          "features": [
            "Todo lo de Crecimiento",
            "Contenido semanal",
            "Enlaces y prensa local",
            "Optimización de conversión"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Preguntas frecuentes",
      "faq": [
        {
          "q": "¿Cuándo se ven resultados?",
          "a": "El SEO necesita tiempo: lo normal es empezar a ver movimiento a partir del tercer mes, y más claro del sexto en adelante. Por eso la permanencia mínima es de 3 meses; menos no sería honesto cobrarlo."
        },
        {
          "q": "¿Garantizáis la primera posición?",
          "a": "No, y desconfía de quien lo prometa. Nadie controla el algoritmo de Google. Lo que garantizamos es trabajo real cada mes y un informe honesto de lo que cambia."
        },
        {
          "q": "¿Tengo que tener la web hecha por vosotros?",
          "a": "No. Podemos hacer SEO sobre tu web actual, la hayamos construido nosotros o no."
        }
      ]
    },
    "care": {
      "eyebrow": "Mantenimiento y soporte · Cuota mensual",
      "h1": "Que tu web funcione\nsin que pienses en ella.",
      "lead": "Hosting, copias, actualizaciones y soporte. Si algo falla, nos enteramos nosotros antes que tú.",
      "intro": [
        "Una web sin mantenimiento se va quedando lenta y desactualizada, hasta que un día algo deja de funcionar. Con este servicio, de la parte técnica nos ocupamos nosotros.",
        "Es independiente del SEO: mantener la web viva y hacerla crecer son dos cosas distintas, y no te obligamos a juntarlas."
      ],
      "includesTitle": "Qué incluye",
      "includes": [
        "Hosting gestionado y dominio",
        "Copias de seguridad automáticas",
        "Actualizaciones y seguridad",
        "Monitorización de caídas y rendimiento",
        "Pequeños cambios de contenido",
        "Soporte por email"
      ],
      "reportTitle": "",
      "report": "",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Planes",
      "plansNote": "Cuota mensual, sin permanencia. IVA no incluido.",
      "plans": [
        {
          "name": "Esencial",
          "tagline": "Lo básico para tener la web sana y segura.",
          "features": [
            "Hosting y dominio",
            "Copias de seguridad",
            "Actualizaciones y seguridad",
            "Monitorización"
          ],
          "featured": false
        },
        {
          "name": "Completo",
          "tagline": "Además, cambios y soporte prioritario.",
          "features": [
            "Todo lo de Esencial",
            "Pequeños cambios de contenido",
            "Soporte prioritario",
            "Informe de estado"
          ],
          "featured": true
        }
      ],
      "faqTitle": "Preguntas frecuentes",
      "faq": [
        {
          "q": "¿Es obligatorio?",
          "a": "No. Puedes llevar tu web por tu cuenta; el código es tuyo. Este servicio existe para quien prefiere no preocuparse de nada técnico."
        },
        {
          "q": "¿Y si quiero cancelar?",
          "a": "Sin permanencia: cancelas cuando quieras. Te ayudamos a mover la web a donde tú decidas."
        }
      ]
    },
    "voice": {
      "eyebrow": "Asistente telefónico con IA · Cuota mensual",
      "h1": "Tu negocio contesta\naunque tú no puedas.",
      "lead": "Un asistente de voz con IA que atiende las llamadas en nombre de tu negocio, 24 horas al día: resuelve dudas, toma reservas o citas y te pasa el recado.",
      "intro": [
        "Cuando estás con un cliente, en cocina, en obra o con el negocio cerrado, el teléfono sigue sonando. Y quien llama y no obtiene respuesta suele probar con el siguiente de la lista.",
        "Configuramos un asistente que habla con la voz y el tono de tu negocio, conoce tus horarios, servicios y precios, y sabe cuándo pasarte la llamada a ti."
      ],
      "includesTitle": "Qué incluye",
      "includes": [
        "Configuración con la información real de tu negocio",
        "Voz natural en español (y otros idiomas si los necesitas)",
        "Atención 24/7, también fines de semana y festivos",
        "Toma de reservas, citas o recados",
        "Transferencia a tu móvil cuando el caso lo requiere",
        "Resumen de cada llamada por email o WhatsApp"
      ],
      "reportTitle": "Cómo sabes lo que pasa",
      "report": "Cada llamada queda registrada con un resumen: quién llamó, qué quería y qué se le respondió. Revisamos las conversaciones contigo y ajustamos el asistente cuando algo no se contesta bien.",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Planes",
      "plansNote": "El precio de cada plan es personalizado según los minutos de llamada que necesite tu negocio. Te lo damos cerrado antes de empezar. Alta y configuración: 290 € (pago único). Cuota mensual, permanencia mínima de 3 meses. IVA no incluido.",
      "plans": [
        {
          "name": "Esencial",
          "tagline": "Para atender las llamadas perdidas y las de fuera de horario.",
          "features": [
            "Minutos según tu volumen de llamadas",
            "Responde dudas frecuentes",
            "Toma recados",
            "Resumen de cada llamada"
          ],
          "featured": false
        },
        {
          "name": "Profesional",
          "tagline": "Tu recepción completa: atiende, reserva y agenda.",
          "features": [
            "Todo lo de Esencial",
            "Reservas y citas en tu calendario",
            "Transferencia de llamadas"
          ],
          "featured": true
        },
        {
          "name": "Avanzado",
          "tagline": "Para negocios con mucho volumen o varios idiomas.",
          "features": [
            "Todo lo de Profesional",
            "Varios idiomas",
            "Integración con tu sistema de reservas o CRM"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Preguntas frecuentes",
      "faq": [
        {
          "q": "¿Cuánto cuesta?",
          "a": "Depende de los minutos de llamada que reciba tu negocio al mes. Miramos juntos tu volumen y te damos un precio cerrado antes de empezar."
        },
        {
          "q": "¿Tengo que cambiar de número?",
          "a": "No. Desviamos las llamadas de tu número actual al asistente: todas, solo las que no contestas o solo fuera de horario. Tú eliges."
        },
        {
          "q": "¿Sabe quien llama que habla con una IA?",
          "a": "Sí. El asistente se presenta como asistente virtual del negocio. Es lo honesto y lo que exige la normativa europea."
        },
        {
          "q": "¿Y si le preguntan algo que no sabe?",
          "a": "No se lo inventa. Toma nota y te pasa el recado, o te transfiere la llamada si lo has configurado así."
        },
        {
          "q": "¿Qué pasa con los datos de las llamadas?",
          "a": "Se tratan conforme al RGPD: se informa a quien llama al inicio y los datos solo se usan para atender a tu negocio."
        }
      ]
    }
  },
  "pages": {
    "estudio": {
      "eyebrow": "Estudio",
      "h1": "Webs hechas para durar.",
      "prose": [
        "El nombre viene del latín aeterna, y el símbolo es un árbol con raíces dentro de un círculo cerrado. Lo elegimos porque resume lo que queremos hacer: webs bien construidas que siguen en pie años después, cuando ya nadie del estudio las está mirando.",
        "Por eso cuidamos lo que no se ve: código limpio, páginas rápidas y una estructura que se pueda ampliar sin rehacerla.",
        "Elegimos los proyectos por lo que tienen que contar, no por el tamaño del presupuesto: un oficio con historia, un lugar con carácter, un negocio que hace las cosas bien y necesita que la web lo demuestre."
      ],
      "beliefsTitle": "En qué creemos",
      "beliefs": [
        {
          "title": "Primero la auditoría",
          "body": "Antes de proponer nada miramos qué hay y qué está roto. En el último proyecto, lo más valioso que encontramos fue que todos los botones de reserva llevaban a una página inexistente. Eso no se arregla con un rediseño bonito."
        },
        {
          "title": "Ninguna cifra inventada",
          "body": "No marcamos como propia la valoración de un tercero, no ponemos premios que no tenemos y no escribimos testimonios. A corto plazo vende menos, pero es lo único que aguanta con el tiempo."
        },
        {
          "title": "El movimiento con motivo",
          "body": "Una animación tiene que explicar algo: una jerarquía, una continuidad, un cambio de estado. Si solo está para impresionar, sobra y además cuesta batería."
        }
      ]
    },
    "contacto": {
      "eyebrow": "Contacto",
      "h1": "Empecemos por\nuna conversación.",
      "lead": "Escríbenos por el formulario, por email o por WhatsApp, como te resulte más cómodo."
    },
    "notFound": {
      "eyebrow": "Error 404",
      "h1": "Esta página no existe.",
      "lead": "O nunca existió, o la movimos y no dejamos el redireccionamiento. Si llegaste desde un enlace nuestro, es culpa nuestra.",
      "back": "Volver al inicio"
    }
  }
};

export type Dict = typeof es;

const en: Dict = {
  "a11y": {
    "language": "Language",
    "nav": "Main",
    "menu": "Navigation menu",
    "home": "home"
  },
  "nav": [
    {
      "label": "Services",
      "href": "/servicios"
    },
    {
      "label": "Studio",
      "href": "/estudio"
    },
    {
      "label": "Contact",
      "href": "/contacto"
    }
  ],
  "cta": "Start a project",
  "skip": "Skip to content",
  "common": {
    "disciplines": [
      "Design",
      "Development",
      "SEO",
      "AI assistant"
    ],
    "positioning": "Premium websites and organic growth",
    "scroll": "Scroll",
    "perMonth": "/mo",
    "oncePayment": "one-time",
    "priceFrom": "from",
    "overview": "The service",
    "customPrice": "Custom pricing",
    "recommended": "Recommended",
    "customPriceNote": "based on the minutes you need",
    "seePlans": "See plans",
    "otherServices": "Other services"
  },
  "hero": {
    "eyebrow": "Independent digital studio",
    "headline": "A better website\nis only the beginning.",
    "support": "We design and build bespoke websites, then work on getting you found. For businesses that have outgrown the site they have.",
    "tagline": "Built so people find you and get in touch.",
    "secondary": "See services"
  },
  "cases": {
    "eyebrow": "Use cases",
    "title": "Real problems,\nsolved to measure.",
    "lead": "Each case tells a business, what was holding it back and what we did. We only publish real cases.",
    "pending": "Pending",
    "problem": "The challenge",
    "solution": "What we did",
    "items": [
      {
        "sector": "Sector pending",
        "title": "Case pending publication",
        "problem": "Pending: what was happening to the business and why its website wasn't helping.",
        "solution": "Pending: what we did and what changed, with real data.",
        "services": [],
        "pending": true
      },
      {
        "sector": "Sector pending",
        "title": "Case pending publication",
        "problem": "Pending: what was happening to the business and why its website wasn't helping.",
        "solution": "Pending: what we did and what changed, with real data.",
        "services": [],
        "pending": true
      },
      {
        "sector": "Sector pending",
        "title": "Case pending publication",
        "problem": "Pending: what was happening to the business and why its website wasn't helping.",
        "solution": "Pending: what we did and what changed, with real data.",
        "services": [],
        "pending": true
      }
    ]
  },
  "services": {
    "eyebrow": "What we do",
    "title": "Four services,\none studio.",
    "all": "See all services"
  },
  "approach": {
    "eyebrow": "How we work",
    "title": "We don't start\nwith the code.",
    "items": [
      {
        "title": "Understand",
        "body": "We look at what's there, what works and what's broken. We put it in writing before proposing anything."
      },
      {
        "title": "Direct",
        "body": "We choose the structure, typography, colour and tone, and explain why. You get one direction from us, not three to pick from."
      },
      {
        "title": "Build",
        "body": "We design and code at the same time, so you see the site working within the first few weeks.",
        "service": "web"
      },
      {
        "title": "Grow",
        "body": "Once the site is live, we keep going: we measure what happens, fix what isn’t working and work on SEO and content so more people find you.",
        "service": "seo"
      }
    ],
    "link": "See how we work",
    "root": ["What's there", "What's missing", "The tone"]
  },
  "studioHome": {
    "eyebrow": "Studio",
    "title": "A small studio,\nby choice.",
    "lead": "Aterna is an independent digital studio. We’re small on purpose, so we can handle every project ourselves.",
    "link": "About the studio",
    "pillars": [
      {
        "title": "The designer builds it",
        "body": "The same person designs your site, builds it and looks after you. Nothing gets lost between teams."
      },
      {
        "title": "The code is yours",
        "body": "No templates, no plugins to update every month. It reads clearly, and any other studio can pick it up."
      },
      {
        "title": "Few projects at once",
        "body": "We only take on a few jobs at a time, so your project isn’t stuck in a queue behind ten others."
      }
    ]
  },
  "finalCta": {
    "eyebrow": "Contact",
    "mailLabel": "Or write to us directly",
    "title": "If your website no longer\nrepresents your business,\nlet’s talk.",
    "lead": "Tell us what you do and what you’d like your website to do for you.",
    "nextTitle": "What happens next",
    "next": [
      {
        "title": "You write to us",
        "body": "With whatever you have: what's there now and by when. No brief needed."
      },
      {
        "title": "We reply",
        "body": "Always, even if it's to say we're not the right studio. If it doesn't fit, we say so early."
      },
      {
        "title": "We put it in writing",
        "body": "A proposal with what we'd do, how long it takes and what it costs, before anything starts."
      }
    ],
    "availability": "Limited schedule: ask about dates and we'll tell you."
  },
  "mobile": {
    "open": "Menu",
    "close": "Close"
  },
  "copyEmail": {
    "copy": "Copy",
    "copied": "Copied"
  },
  "contactForm": {
    "name": "Name",
    "email": "Email",
    "message": "Message",
    "submit": "Send message",
    "sending": "Sending…",
    "sent": "✓ Message sent. We'll reply as soon as we read it.",
    "error": "Couldn't send. Try again or email us.",
    "idle": "We reply to everything, even if it's to say we're not the right studio.",
    "consentLegend": "GDPR agreement",
    "consentText": "I consent to this website storing the information I submit so that you can respond to my request.",
    "consentMore": "More information in the",
    "consentLink": "privacy policy",
    "consentHref": "/datenschutz"
  },
  "whatsapp": {
    "message": "Hi, I'd like more information about Aterna Studio.",
    "aria": "Message on WhatsApp"
  },
  "assistant": {
    "open": "Open the Aterna assistant",
    "close": "Close the assistant",
    "title": "Aterna assistant",
    "note": "It answers with what this website says. For anything specific, write to us.",
    "placeholder": "Ask anything…",
    "send": "Send",
    "labels": ["Thinking", "Searching", "Reading the site", "Writing"],
    "answer": "Answer",
    "restart": "Start over",
    "suggestions": ["How much is a website?", "What does SEO include?", "How do you work?", "How do I contact you?"],
    "hello": "Hi! I'm the Aterna assistant. I can tell you what we do, what it costs and how we work. What would you like to know?",
    "fallback": "I can't find that on the website and I'd rather not make it up. Write to us and we'll answer ourselves.",
    "contactLink": "Write to us",
    "plansIntro": "{service} plans:",
    "custom": "custom pricing",
    "studioLink": "About the studio",
    "methodLink": "See how we work",
    "plansLabel": "{service} plans",
    "contactLabel": "How do I contact you?",
    "nearest": "One of these might help:",
    "askWhatsApp": "Ask on WhatsApp",
    "question": "Hi, I have a question: {q}",
    "flow": {
      "start": "Help me choose",
      "need": {
        "q": "What do you need?",
        "options": [
          {
            "label": "A new website or a redesign",
            "service": "web"
          },
          {
            "label": "To be found on Google",
            "service": "seo"
          },
          {
            "label": "Someone to look after my site",
            "service": "mantenimiento"
          },
          {
            "label": "Help answering calls",
            "service": "asistente-ia"
          },
          {
            "label": "I'm not sure yet",
            "service": ""
          }
        ]
      },
      "sector": {
        "q": "What does your business do?",
        "options": [
          "Restaurant or café",
          "Shop",
          "Health or wellbeing",
          "Professional services",
          "Something else"
        ]
      },
      "when": {
        "q": "When do you need it?",
        "options": [
          "As soon as possible",
          "In the next few months",
          "Just looking"
        ]
      },
      "summary": "This is the one for you: {service}, {price}. Here's the message ready to go: send it on WhatsApp or through the form and we'll reply with a proposal.",
      "summaryUnsure": "Let's work it out together. Here's the message ready to go: send it on WhatsApp or through the form and we'll tell you what we'd do in your case.",
      "intro": "Hi, I'm writing from the assistant on your website.",
      "fields": {
        "service": "Interested in",
        "sector": "Sector",
        "when": "Timing"
      },
      "unsure": "not sure yet",
      "whatsapp": "Send on WhatsApp",
      "form": "Use the form"
    }
  },
  "servicePages": {
    "index": {
      "eyebrow": "Services",
      "h1": "Four ways\nto work together.",
      "lead": "We design and build your website, keep it running, get you found and answer your calls when you can’t. Start with one and add the others whenever you want.",
      "cards": [
        {
          "slug": "web",
          "kicker": "One-time",
          "title": "Web design & development",
          "body": "A website made for your business and nobody else’s. Design, art direction and our own code.",
          "cta": "See web design"
        },
        {
          "slug": "seo",
          "kicker": "Monthly",
          "title": "SEO & organic growth",
          "body": "Get found by people already searching for what you offer. Monthly work, with a clear report on what changes.",
          "cta": "See SEO"
        },
        {
          "slug": "mantenimiento",
          "kicker": "Monthly",
          "title": "Maintenance & support",
          "body": "We look after hosting, backups and updates so you don’t have to think about them.",
          "cta": "See maintenance"
        },
        {
          "slug": "asistente-ia",
          "kicker": "Monthly",
          "title": "AI phone assistant",
          "body": "A voice assistant that answers your business’s calls around the clock, including when you’re busy or already closed.",
          "cta": "See AI assistant"
        }
      ]
    },
    "web": {
      "eyebrow": "Web design & development · One-time",
      "h1": "A website that actually\nlooks like your business.",
      "lead": "Bespoke web design, art direction and development, with no templates or plugins to maintain. When we finish, the code is yours.",
      "intro": [
        "A lot of websites look alike because they come from the same handful of templates. We start with a different question: what does yours need to achieve? Getting found, getting bookings, making sales. Once that’s clear, we decide on structure, art direction and code."
      ],
      "includesTitle": "What’s included",
      "includes": [
        "Audit and strategy before designing anything",
        "Bespoke art direction: typography, colour, image and tone",
        "Design of the full experience, desktop to mobile",
        "Our own fast, accessible code (Core Web Vitals as a target)",
        "Baseline technical SEO and structured data",
        "Launch, testing and code handover"
      ],
      "reportTitle": "",
      "report": "",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Plans",
      "plansNote": "Indicative price by scope. VAT not included.",
      "plans": [
        {
          "name": "Essential",
          "tagline": "A one-page or small site to get off to a good start.",
          "features": [
            "Up to 3 sections",
            "Bespoke design",
            "Contact form",
            "Responsive and accessible"
          ],
          "featured": false
        },
        {
          "name": "Bespoke",
          "tagline": "What we build most often: a complete multi-page site.",
          "features": [
            "Custom pages, no fixed limit",
            "Full art direction",
            "Motion and interaction where it helps",
            "Technical SEO + structured data"
          ],
          "featured": true
        },
        {
          "name": "Premium",
          "tagline": "For when the site needs to do more.",
          "features": [
            "Multi-language",
            "Booking or store",
            "3D experiences / advanced motion",
            "Everything above"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Frequently asked",
      "faq": [
        {
          "q": "How long does it take?",
          "a": "It depends on scope, but a bespoke site is usually 3 to 6 weeks once we have the content. We give you a schedule before we start."
        },
        {
          "q": "Is the code mine?",
          "a": "Yes. We hand over the code and it’s yours. It’s written so another studio can pick it up if you ever switch."
        },
        {
          "q": "Is maintenance included?",
          "a": "Maintenance (hosting, backups, updates, support) is a separate, optional service. You can take it on or run the site yourself."
        }
      ]
    },
    "seo": {
      "eyebrow": "SEO & organic growth · Monthly",
      "h1": "SEO and organic growth\nfor local businesses.",
      "lead": "You can have a great website, but if nobody finds it, it won’t do much for you. SEO is what makes you show up when someone searches for what you do.",
      "intro": [
        "What we promise is work done every month and explained clearly. SEO doesn’t climb in a straight line, it moves in jumps, and you’ll see that month by month in real data.",
        "Our organic growth work focuses mostly on local visibility: hotels, wineries, restaurants and any business that depends on showing up in “near me” searches."
      ],
      "includesTitle": "What we work on each month",
      "includes": [
        "Technical SEO and site health",
        "Search and intent (keyword research)",
        "On-page optimisation and content",
        "Local visibility and Google Business Profile",
        "Internal linking and authority",
        "Measurement, report and next steps"
      ],
      "reportTitle": "How we report",
      "report": "Every month you get the same layout, even when it’s been a slow month: what we found, what we did, what changed, what didn’t, and what we’re trying next.",
      "examplesTitle": "An example of what you get",
      "examplesLead": "This is the audit and report we prepare, in two different sectors:",
      "examples": [
        {
          "label": "Renovation company",
          "title": "Solera Reformas",
          "href": "/ejemplos/reformas-sevilla/"
        },
        {
          "label": "Tax advisory",
          "title": "Nexo Asesores",
          "href": "/ejemplos/nexo-asesores/"
        }
      ],
      "plansTitle": "Plans",
      "plansNote": "Monthly fee, 3-month minimum. VAT not included. Cancel whenever you want: the site stays yours.",
      "plans": [
        {
          "name": "Care",
          "tagline": "Look after what you already have and climb bit by bit.",
          "features": [
            "Google Business Profile",
            "Technical SEO and monitoring",
            "1 piece of content a month",
            "Monthly report"
          ],
          "featured": false
        },
        {
          "name": "Growth",
          "tagline": "Move up in your area, month after month.",
          "features": [
            "Everything in Care",
            "Area and service pages",
            "More content and reviews",
            "Advanced structured data"
          ],
          "featured": true
        },
        {
          "name": "Dominance",
          "tagline": "Be the first name that comes up in your area.",
          "features": [
            "Everything in Growth",
            "Weekly content",
            "Links and local press",
            "Conversion optimisation"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Frequently asked",
      "faq": [
        {
          "q": "When do results show?",
          "a": "SEO takes time: it’s normal to start seeing movement from the third month, and more clearly from the sixth on. That’s why the minimum is 3 months; less wouldn’t be honest to charge."
        },
        {
          "q": "Do you guarantee the top spot?",
          "a": "No, and be wary of anyone who does. Nobody controls Google’s algorithm. What we guarantee is real work every month and an honest report of what changes."
        },
        {
          "q": "Do you have to have built my site?",
          "a": "No. We can do SEO on your current site, whether we built it or not."
        }
      ]
    },
    "care": {
      "eyebrow": "Maintenance & support · Monthly",
      "h1": "Your website keeps running\nwithout you thinking about it.",
      "lead": "Hosting, backups, updates and support. If something breaks, we find out before you do.",
      "intro": [
        "Without maintenance, a website gradually gets slower and more out of date, until one day something stops working. With this service, the technical side is our job.",
        "It’s independent from SEO: keeping the site alive and growing it are two different things, and we don’t force you to bundle them."
      ],
      "includesTitle": "What’s included",
      "includes": [
        "Managed hosting and domain",
        "Automatic backups",
        "Updates and security",
        "Uptime and performance monitoring",
        "Small content changes",
        "Email support"
      ],
      "reportTitle": "",
      "report": "",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Plans",
      "plansNote": "Monthly fee, no lock-in. VAT not included.",
      "plans": [
        {
          "name": "Essential",
          "tagline": "The basics to keep the site healthy and secure.",
          "features": [
            "Hosting and domain",
            "Backups",
            "Updates and security",
            "Monitoring"
          ],
          "featured": false
        },
        {
          "name": "Complete",
          "tagline": "Plus changes and priority support.",
          "features": [
            "Everything in Essential",
            "Small content changes",
            "Priority support",
            "Status report"
          ],
          "featured": true
        }
      ],
      "faqTitle": "Frequently asked",
      "faq": [
        {
          "q": "Is it mandatory?",
          "a": "No. You can run your site yourself; the code is yours. This service is for those who’d rather not worry about anything technical."
        },
        {
          "q": "What if I want to cancel?",
          "a": "No lock-in: cancel whenever you want. We’ll help you move the site wherever you decide."
        }
      ]
    },
    "voice": {
      "eyebrow": "AI phone assistant · Monthly",
      "h1": "Your business picks up,\neven when you can’t.",
      "lead": "An AI voice assistant that takes calls on behalf of your business, 24 hours a day: it answers questions, takes bookings or appointments and passes the message on to you.",
      "intro": [
        "When you’re with a client, in the kitchen, on site or closed, the phone keeps ringing. And a caller who gets no answer usually tries the next name on the list.",
        "We set up an assistant that speaks with your business’s voice and tone, knows your hours, services and prices, and knows when to hand the call to you."
      ],
      "includesTitle": "What’s included",
      "includes": [
        "Set-up with your business’s real information",
        "Natural voice in Spanish (and other languages if you need them)",
        "24/7 answering, weekends and holidays included",
        "Bookings, appointments or messages",
        "Transfer to your mobile when the case calls for it",
        "Summary of every call by email or WhatsApp"
      ],
      "reportTitle": "How you know what happens",
      "report": "Every call is logged with a summary: who called, what they wanted and what they were told. We review the conversations with you and adjust the assistant when something isn’t answered well.",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Plans",
      "plansNote": "Each plan is priced individually based on the call minutes your business needs. You get a fixed price before we start. Set-up and configuration: €290 (one-time). Monthly fee, 3-month minimum. VAT not included.",
      "plans": [
        {
          "name": "Essential",
          "tagline": "For missed and after-hours calls.",
          "features": [
            "Minutes based on your call volume",
            "Answers frequent questions",
            "Takes messages",
            "Summary of every call"
          ],
          "featured": false
        },
        {
          "name": "Professional",
          "tagline": "Your full front desk: answers, books and schedules.",
          "features": [
            "Everything in Essential",
            "Bookings and appointments in your calendar",
            "Call transfer"
          ],
          "featured": true
        },
        {
          "name": "Advanced",
          "tagline": "For high-volume or multilingual businesses.",
          "features": [
            "Everything in Professional",
            "Multiple languages",
            "Integration with your booking system or CRM"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Frequently asked",
      "faq": [
        {
          "q": "How much does it cost?",
          "a": "It depends on how many call minutes your business gets each month. We look at your volume together and give you a fixed price before we start."
        },
        {
          "q": "Do I have to change my number?",
          "a": "No. We forward calls from your current number to the assistant: all of them, only the ones you miss, or only outside opening hours. Your choice."
        },
        {
          "q": "Do callers know they’re talking to an AI?",
          "a": "Yes. The assistant introduces itself as the business’s virtual assistant. It’s the honest thing to do and what European rules require."
        },
        {
          "q": "What if it’s asked something it doesn’t know?",
          "a": "It doesn’t make it up. It takes a note and passes the message on to you, or transfers the call if you’ve set it up that way."
        },
        {
          "q": "What about call data?",
          "a": "It’s handled under GDPR: callers are informed at the start and the data is only used to serve your business."
        }
      ]
    }
  },
  "pages": {
    "estudio": {
      "eyebrow": "Studio",
      "h1": "Websites built to last.",
      "prose": [
        "The name comes from the Latin aeterna, and the symbol is a tree with roots inside a closed circle. We chose it because it sums up what we want to make: well-built websites that are still standing years later, when nobody at the studio is looking at them any more.",
        "That's why we care about what you can't see: clean code, fast pages and a structure that can grow without being rebuilt.",
        "We choose projects for what they have to say, not for the size of the budget: a craft with history, a place with character, a business that does things well and needs the website to show it."
      ],
      "beliefsTitle": "What we believe",
      "beliefs": [
        {
          "title": "Audit first",
          "body": "Before proposing anything we look at what's there and what's broken. On the last project, the most valuable thing we found was that every booking button led to a page that didn't exist. A pretty redesign doesn't fix that."
        },
        {
          "title": "No invented numbers",
          "body": "We don't pass off someone else's rating as our own, we don't display awards we don't have and we don't write testimonials. It sells less in the short term, but it's the only thing that holds up over time."
        },
        {
          "title": "Motion with a reason",
          "body": "An animation has to explain something: a hierarchy, a continuity, a change of state. If it's only there to impress, it doesn't belong, and it drains the battery too."
        }
      ]
    },
    "contacto": {
      "eyebrow": "Contact",
      "h1": "Let’s start with\na conversation.",
      "lead": "Write to us through the form, by email or on WhatsApp, whichever suits you best."
    },
    "notFound": {
      "eyebrow": "Error 404",
      "h1": "This page doesn't exist.",
      "lead": "Either it never existed, or we moved it and didn't leave a redirect. If you got here from one of our links, that's on us.",
      "back": "Back to home"
    }
  }
};

const nl: Dict = {
  "a11y": {
    "language": "Taal",
    "nav": "Hoofdmenu",
    "menu": "Navigatiemenu",
    "home": "home"
  },
  "nav": [
    {
      "label": "Diensten",
      "href": "/servicios"
    },
    {
      "label": "Studio",
      "href": "/estudio"
    },
    {
      "label": "Contact",
      "href": "/contacto"
    }
  ],
  "cta": "Start een project",
  "skip": "Naar de inhoud",
  "common": {
    "disciplines": [
      "Ontwerp",
      "Ontwikkeling",
      "SEO",
      "AI-assistent"
    ],
    "positioning": "Premium websites en organische groei",
    "scroll": "Scroll",
    "perMonth": "/mnd",
    "oncePayment": "eenmalig",
    "priceFrom": "vanaf",
    "overview": "De dienst",
    "customPrice": "Prijs op maat",
    "recommended": "Aanbevolen",
    "customPriceNote": "op basis van de minuten die je nodig hebt",
    "seePlans": "Bekijk pakketten",
    "otherServices": "Andere diensten"
  },
  "hero": {
    "eyebrow": "Onafhankelijke digitale studio",
    "headline": "Een betere website\nis pas het begin.",
    "support": "We ontwerpen en bouwen websites op maat en zorgen daarna dat je gevonden wordt. Voor bedrijven die hun huidige website ontgroeid zijn.",
    "tagline": "Zo gemaakt dat mensen je vinden en contact opnemen.",
    "secondary": "Bekijk diensten"
  },
  "cases": {
    "eyebrow": "Praktijkvoorbeelden",
    "title": "Echte problemen,\nop maat opgelost.",
    "lead": "Elk voorbeeld vertelt over een bedrijf, wat het tegenhield en wat we deden. We publiceren alleen echte cases.",
    "pending": "Volgt",
    "problem": "De uitdaging",
    "solution": "Wat we deden",
    "items": [
      {
        "sector": "Sector volgt",
        "title": "Case nog niet gepubliceerd",
        "problem": "Volgt: wat er speelde bij het bedrijf en waarom de website niet hielp.",
        "solution": "Volgt: wat we deden en wat er veranderde, met echte cijfers.",
        "services": [],
        "pending": true
      },
      {
        "sector": "Sector volgt",
        "title": "Case nog niet gepubliceerd",
        "problem": "Volgt: wat er speelde bij het bedrijf en waarom de website niet hielp.",
        "solution": "Volgt: wat we deden en wat er veranderde, met echte cijfers.",
        "services": [],
        "pending": true
      },
      {
        "sector": "Sector volgt",
        "title": "Case nog niet gepubliceerd",
        "problem": "Volgt: wat er speelde bij het bedrijf en waarom de website niet hielp.",
        "solution": "Volgt: wat we deden en wat er veranderde, met echte cijfers.",
        "services": [],
        "pending": true
      }
    ]
  },
  "services": {
    "eyebrow": "Wat we doen",
    "title": "Vier diensten,\néén studio.",
    "all": "Bekijk alle diensten"
  },
  "approach": {
    "eyebrow": "Hoe we werken",
    "title": "We beginnen niet\nmet de code.",
    "items": [
      {
        "title": "Begrijpen",
        "body": "We kijken wat er is, wat werkt en wat kapot is. We zetten het op papier voordat we iets voorstellen."
      },
      {
        "title": "Richting geven",
        "body": "We kiezen structuur, typografie, kleur en toon, en leggen uit waarom. Je krijgt één richting van ons, niet drie om uit te kiezen."
      },
      {
        "title": "Bouwen",
        "body": "We ontwerpen en programmeren tegelijk, dus je ziet de website al in de eerste weken werken.",
        "service": "web"
      },
      {
        "title": "Groeien",
        "body": "Als de website live staat, gaan we door: we meten wat er gebeurt, verbeteren wat niet werkt en werken aan SEO en content, zodat meer mensen je vinden.",
        "service": "seo"
      }
    ],
    "link": "Bekijk hoe we werken",
    "root": ["Wat er is", "Wat ontbreekt", "De toon"]
  },
  "studioHome": {
    "eyebrow": "Studio",
    "title": "Een kleine studio,\nbewust.",
    "lead": "Aterna is een onafhankelijke digitale studio. We zijn bewust klein, zodat we elk project zelf kunnen doen.",
    "link": "Maak kennis met de studio",
    "pillars": [
      {
        "title": "Wie ontwerpt, bouwt ook",
        "body": "Dezelfde persoon ontwerpt je website, bouwt hem en staat je te woord. Niets raakt kwijt tussen teams."
      },
      {
        "title": "De code is van jou",
        "body": "Geen templates of plug-ins die je elke maand moet bijwerken. Hij is leesbaar, en elke andere studio kan ermee verder."
      },
      {
        "title": "Weinig projecten tegelijk",
        "body": "We nemen weinig opdrachten tegelijk aan, dus jouw project staat niet in de rij achter tien andere."
      }
    ]
  },
  "finalCta": {
    "eyebrow": "Contact",
    "mailLabel": "Of mail ons direct",
    "title": "Past je website niet meer\nbij je bedrijf?\nLaten we praten.",
    "lead": "Vertel ons wat je doet en wat je van je website verwacht.",
    "nextTitle": "Wat er daarna gebeurt",
    "next": [
      {
        "title": "Je schrijft ons",
        "body": "Met wat je hebt: wat er nu is en wanneer het klaar moet zijn. Een briefing is niet nodig."
      },
      {
        "title": "We antwoorden",
        "body": "Altijd, ook als het is om te zeggen dat we niet de juiste studio zijn. Past het niet, dan zeggen we dat snel."
      },
      {
        "title": "We zetten het op papier",
        "body": "Een voorstel met wat we zouden doen, in welke termijn en voor welk bedrag, voordat er iets begint."
      }
    ],
    "availability": "Beperkte agenda: vraag naar data en we laten het je weten."
  },
  "mobile": {
    "open": "Menu",
    "close": "Sluiten"
  },
  "copyEmail": {
    "copy": "Kopiëren",
    "copied": "Gekopieerd"
  },
  "contactForm": {
    "name": "Naam",
    "email": "E-mail",
    "message": "Bericht",
    "submit": "Bericht versturen",
    "sending": "Versturen…",
    "sent": "✓ Bericht verstuurd. We antwoorden zodra we het gelezen hebben.",
    "error": "Versturen is niet gelukt. Probeer het opnieuw of mail ons.",
    "idle": "We antwoorden op alles, ook als het is om te zeggen dat we niet de juiste studio zijn.",
    "consentLegend": "AVG-toestemming",
    "consentText": "Ik geef toestemming dat deze website de informatie die ik verstuur bewaart, zodat jullie op mijn verzoek kunnen reageren.",
    "consentMore": "Meer informatie in het",
    "consentLink": "privacybeleid",
    "consentHref": "/datenschutz"
  },
  "whatsapp": {
    "message": "Hallo, ik wil graag meer informatie over Aterna Studio.",
    "aria": "Stuur een WhatsApp-bericht"
  },
  "assistant": {
    "open": "Open de assistent van Aterna",
    "close": "Sluit de assistent",
    "title": "Assistent van Aterna",
    "note": "Antwoordt met wat op deze website staat. Voor iets specifieks: schrijf ons.",
    "placeholder": "Stel je vraag…",
    "send": "Versturen",
    "labels": ["Nadenken", "Zoeken", "De website lezen", "Schrijven"],
    "answer": "Antwoord",
    "restart": "Opnieuw beginnen",
    "suggestions": ["Wat kost een website?", "Wat houdt SEO in?", "Hoe werken jullie?", "Hoe neem ik contact op?"],
    "hello": "Hoi! Ik ben de assistent van Aterna. Ik vertel je wat we doen, wat het kost en hoe we werken. Wat wil je weten?",
    "fallback": "Dat vind ik niet op de website en ik verzin liever niets. Schrijf ons, dan antwoorden we zelf.",
    "contactLink": "Schrijf ons",
    "plansIntro": "Pakketten voor {service}:",
    "custom": "prijs op maat",
    "studioLink": "Maak kennis met de studio",
    "methodLink": "Bekijk hoe we werken",
    "plansLabel": "Pakketten voor {service}",
    "contactLabel": "Hoe neem ik contact op?",
    "nearest": "Misschien heb je hier iets aan:",
    "askWhatsApp": "Vragen via WhatsApp",
    "question": "Hallo, ik heb een vraag: {q}",
    "flow": {
      "start": "Help me kiezen",
      "need": {
        "q": "Wat heb je nodig?",
        "options": [
          {
            "label": "Een nieuwe website of een vernieuwing",
            "service": "web"
          },
          {
            "label": "Gevonden worden in Google",
            "service": "seo"
          },
          {
            "label": "Iemand die mijn website onderhoudt",
            "service": "mantenimiento"
          },
          {
            "label": "Telefoontjes laten beantwoorden",
            "service": "asistente-ia"
          },
          {
            "label": "Weet ik nog niet",
            "service": ""
          }
        ]
      },
      "sector": {
        "q": "Wat voor bedrijf heb je?",
        "options": [
          "Restaurant of café",
          "Winkel",
          "Zorg of welzijn",
          "Zakelijke dienstverlening",
          "Iets anders"
        ]
      },
      "when": {
        "q": "Wanneer heb je het nodig?",
        "options": [
          "Zo snel mogelijk",
          "In de komende maanden",
          "Ik kijk alleen even rond"
        ]
      },
      "summary": "Dit past bij je: {service}, {price}. Het bericht staat klaar: stuur het via WhatsApp of het formulier en we reageren met een voorstel.",
      "summaryUnsure": "Dan bekijken we het samen. Het bericht staat klaar: stuur het via WhatsApp of het formulier en we vertellen je wat we in jouw geval zouden doen.",
      "intro": "Hallo, ik kom via de assistent op jullie website.",
      "fields": {
        "service": "Interesse in",
        "sector": "Sector",
        "when": "Wanneer"
      },
      "unsure": "weet ik nog niet",
      "whatsapp": "Versturen via WhatsApp",
      "form": "Het formulier gebruiken"
    }
  },
  "servicePages": {
    "index": {
      "eyebrow": "Diensten",
      "h1": "Vier manieren\nom samen te werken.",
      "lead": "We ontwerpen en bouwen je website, houden hem in leven, zorgen dat je gevonden wordt en nemen je telefoon op als jij dat niet kunt. Begin met één en voeg de rest toe wanneer je wilt.",
      "cards": [
        {
          "slug": "web",
          "kicker": "Eenmalig",
          "title": "Webdesign en -ontwikkeling",
          "body": "Een website die voor jouw bedrijf gemaakt is, niet voor zomaar iedereen. Ontwerp, art direction en eigen code.",
          "cta": "Bekijk webdesign"
        },
        {
          "slug": "seo",
          "kicker": "Maandelijks",
          "title": "SEO en organische groei",
          "body": "Gevonden worden door mensen die al zoeken naar wat jij aanbiedt. Maandelijks werk, met een helder verslag van wat er verandert.",
          "cta": "Bekijk SEO"
        },
        {
          "slug": "mantenimiento",
          "kicker": "Maandelijks",
          "title": "Onderhoud en support",
          "body": "Wij regelen hosting, back-ups en updates, zodat jij daar niet aan hoeft te denken.",
          "cta": "Bekijk onderhoud"
        },
        {
          "slug": "asistente-ia",
          "kicker": "Maandelijks",
          "title": "AI-telefoonassistent",
          "body": "Een spraakassistent die 24 uur per dag de telefoon van je bedrijf opneemt, ook als je het druk hebt of al dicht bent.",
          "cta": "Bekijk AI-assistent"
        }
      ]
    },
    "web": {
      "eyebrow": "Webdesign en -ontwikkeling · Eenmalig",
      "h1": "Een website die echt\nbij je bedrijf past.",
      "lead": "Webdesign, art direction en ontwikkeling op maat, zonder templates of plug-ins om bij te houden. Als we klaar zijn, is de code van jou.",
      "intro": [
        "Veel websites lijken op elkaar omdat ze uit hetzelfde handjevol templates komen. Wij beginnen met een andere vraag: wat moet de jouwe bereiken? Gevonden worden, boekingen binnenhalen, verkopen. Als dat duidelijk is, kiezen we structuur, art direction en code."
      ],
      "includesTitle": "Wat erbij zit",
      "includes": [
        "Audit en strategie voordat we iets ontwerpen",
        "Art direction op maat: typografie, kleur, beeld en toon",
        "Ontwerp van de hele ervaring, van desktop tot mobiel",
        "Eigen, snelle en toegankelijke code (Core Web Vitals als doel)",
        "Technische basis-SEO en gestructureerde data",
        "Livegang, testen en overdracht van de code"
      ],
      "reportTitle": "",
      "report": "",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Pakketten",
      "plansNote": "Indicatieve prijs afhankelijk van de omvang. Exclusief btw.",
      "plans": [
        {
          "name": "Essentieel",
          "tagline": "Een one-pager of kleine website om goed te beginnen.",
          "features": [
            "Tot 3 secties",
            "Ontwerp op maat",
            "Contactformulier",
            "Responsive en toegankelijk"
          ],
          "featured": false
        },
        {
          "name": "Op maat",
          "tagline": "Wat we het vaakst maken: een complete website met meerdere pagina's.",
          "features": [
            "Pagina's op maat, zonder vaste limiet",
            "Volledige art direction",
            "Motion en interactie waar het iets toevoegt",
            "Technische SEO + gestructureerde data"
          ],
          "featured": true
        },
        {
          "name": "Premium",
          "tagline": "Voor als de website meer moet kunnen.",
          "features": [
            "Meertalig",
            "Reserveringen of webshop",
            "3D-ervaringen / geavanceerde motion",
            "Alles hierboven"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Veelgestelde vragen",
      "faq": [
        {
          "q": "Hoe lang duurt het?",
          "a": "Dat hangt af van de omvang, maar een website op maat duurt meestal 3 tot 6 weken vanaf het moment dat we de content hebben. Je krijgt een planning voordat we beginnen."
        },
        {
          "q": "Is de code van mij?",
          "a": "Ja. We dragen de code aan je over en hij is van jou. Hij is zo geschreven dat een andere studio ermee verder kan als je ooit overstapt."
        },
        {
          "q": "Zit onderhoud erbij?",
          "a": "Onderhoud (hosting, back-ups, updates, support) is een aparte, optionele dienst. Je kunt het afnemen of de website zelf beheren."
        }
      ]
    },
    "seo": {
      "eyebrow": "SEO en organische groei · Maandelijks",
      "h1": "SEO en organische groei\nvoor lokale bedrijven.",
      "lead": "Je kunt een prachtige website hebben, maar als niemand hem vindt, heb je er weinig aan. SEO zorgt ervoor dat je verschijnt als iemand zoekt naar wat jij doet.",
      "intro": [
        "Wat we beloven is werk dat elke maand gedaan en helder uitgelegd wordt. SEO stijgt niet in een rechte lijn maar met sprongen, en dat zie je maand na maand in echte cijfers.",
        "Bij organische groei richten we ons vooral op lokale zichtbaarheid: hotels, wijnhuizen, restaurants en elk bedrijf dat moet verschijnen bij zoekopdrachten als «bij mij in de buurt»."
      ],
      "includesTitle": "Waar we elke maand aan werken",
      "includes": [
        "Technische SEO en gezondheid van de site",
        "Zoekopdrachten en intentie (zoekwoordonderzoek)",
        "On-page optimalisatie en content",
        "Lokale zichtbaarheid en Google Bedrijfsprofiel",
        "Interne links en autoriteit",
        "Meting, rapport en volgende stappen"
      ],
      "reportTitle": "Hoe we rapporteren",
      "report": "Elke maand krijg je hetzelfde schema, ook als het een rustige maand was: wat we vonden, wat we deden, wat er veranderde, wat niet, en wat we nu gaan proberen.",
      "examplesTitle": "Een voorbeeld van wat je krijgt",
      "examplesLead": "Zo zien de audit en het rapport eruit die we maken, in twee verschillende sectoren:",
      "examples": [
        {
          "label": "Renovatiebedrijf",
          "title": "Solera Reformas",
          "href": "/ejemplos/reformas-sevilla/"
        },
        {
          "label": "Belastingadvies",
          "title": "Nexo Asesores",
          "href": "/ejemplos/nexo-asesores/"
        }
      ],
      "plansTitle": "Pakketten",
      "plansNote": "Maandbedrag, minimaal 3 maanden. Exclusief btw. Je kunt opzeggen wanneer je wilt: de website blijft van jou.",
      "plans": [
        {
          "name": "Zorg",
          "tagline": "Onderhouden wat je al hebt en stap voor stap stijgen.",
          "features": [
            "Google Bedrijfsprofiel",
            "Technische SEO en monitoring",
            "1 stuk content per maand",
            "Maandrapport"
          ],
          "featured": false
        },
        {
          "name": "Groei",
          "tagline": "Maand na maand hoger komen in je regio.",
          "features": [
            "Alles uit Zorg",
            "Pagina's per regio en dienst",
            "Meer content en reviews",
            "Geavanceerde gestructureerde data"
          ],
          "featured": true
        },
        {
          "name": "Dominantie",
          "tagline": "De eerste naam worden die opduikt in je regio.",
          "features": [
            "Alles uit Groei",
            "Wekelijkse content",
            "Links en lokale pers",
            "Conversie-optimalisatie"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Veelgestelde vragen",
      "faq": [
        {
          "q": "Wanneer zie ik resultaat?",
          "a": "SEO kost tijd: meestal zie je vanaf de derde maand beweging, en duidelijker vanaf de zesde. Daarom is de minimale looptijd 3 maanden; korter zou niet eerlijk zijn om in rekening te brengen."
        },
        {
          "q": "Garanderen jullie de eerste plek?",
          "a": "Nee, en wees op je hoede voor wie dat belooft. Niemand heeft het algoritme van Google in handen. Wat we garanderen is elke maand echt werk en een eerlijk rapport van wat er verandert."
        },
        {
          "q": "Moet mijn website door jullie gebouwd zijn?",
          "a": "Nee. We kunnen SEO doen voor je huidige website, of wij die nu gebouwd hebben of niet."
        }
      ]
    },
    "care": {
      "eyebrow": "Onderhoud en support · Maandelijks",
      "h1": "Je website blijft draaien\nzonder dat je eraan denkt.",
      "lead": "Hosting, back-ups, updates en support. Als er iets misgaat, weten wij het eerder dan jij.",
      "intro": [
        "Zonder onderhoud wordt een website langzaam trager en verouderd, tot er op een dag iets niet meer werkt. Met deze dienst is het technische deel onze zaak.",
        "Hij staat los van SEO: een website in leven houden en hem laten groeien zijn twee verschillende dingen, en we dwingen je niet om ze samen te nemen."
      ],
      "includesTitle": "Wat erbij zit",
      "includes": [
        "Beheerde hosting en domein",
        "Automatische back-ups",
        "Updates en beveiliging",
        "Monitoring van storingen en prestaties",
        "Kleine contentwijzigingen",
        "Support per e-mail"
      ],
      "reportTitle": "",
      "report": "",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Pakketten",
      "plansNote": "Maandbedrag, zonder vaste looptijd. Exclusief btw.",
      "plans": [
        {
          "name": "Essentieel",
          "tagline": "De basis voor een gezonde en veilige website.",
          "features": [
            "Hosting en domein",
            "Back-ups",
            "Updates en beveiliging",
            "Monitoring"
          ],
          "featured": false
        },
        {
          "name": "Compleet",
          "tagline": "Plus wijzigingen en support met voorrang.",
          "features": [
            "Alles uit Essentieel",
            "Kleine contentwijzigingen",
            "Support met voorrang",
            "Statusrapport"
          ],
          "featured": true
        }
      ],
      "faqTitle": "Veelgestelde vragen",
      "faq": [
        {
          "q": "Is het verplicht?",
          "a": "Nee. Je kunt je website zelf beheren; de code is van jou. Deze dienst is er voor wie zich liever nergens technisch druk over maakt."
        },
        {
          "q": "En als ik wil opzeggen?",
          "a": "Geen vaste looptijd: je zegt op wanneer je wilt. We helpen je de website te verhuizen naar waar jij wilt."
        }
      ]
    },
    "voice": {
      "eyebrow": "AI-telefoonassistent · Maandelijks",
      "h1": "Je bedrijf neemt op,\nook als jij dat niet kunt.",
      "lead": "Een AI-spraakassistent die namens je bedrijf de telefoon opneemt, 24 uur per dag: hij beantwoordt vragen, neemt reserveringen of afspraken aan en geeft de boodschap aan je door.",
      "intro": [
        "Als je bij een klant bent, in de keuken staat, op de bouwplaats bent of gesloten hebt, blijft de telefoon gaan. En wie belt en geen gehoor krijgt, probeert meestal de volgende op de lijst.",
        "We stellen een assistent in die spreekt met de stem en de toon van je bedrijf, je openingstijden, diensten en prijzen kent, en weet wanneer hij het gesprek aan jou moet doorgeven."
      ],
      "includesTitle": "Wat erbij zit",
      "includes": [
        "Inrichting met de echte informatie van je bedrijf",
        "Natuurlijke stem in het Spaans (en in andere talen als je die nodig hebt)",
        "24/7 bereikbaar, ook in het weekend en op feestdagen",
        "Reserveringen, afspraken of boodschappen aannemen",
        "Doorverbinden naar je mobiel als dat nodig is",
        "Samenvatting van elk gesprek per e-mail of WhatsApp"
      ],
      "reportTitle": "Hoe je weet wat er gebeurt",
      "report": "Elk gesprek wordt vastgelegd met een samenvatting: wie belde, wat hij wilde en wat hem geantwoord werd. We nemen de gesprekken samen met je door en passen de assistent aan als iets niet goed beantwoord wordt.",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Pakketten",
      "plansNote": "De prijs van elk pakket is op maat, op basis van de belminuten die je bedrijf nodig heeft. Je krijgt een vaste prijs voordat we beginnen. Aansluiting en inrichting: € 290 (eenmalig). Maandbedrag, minimaal 3 maanden. Exclusief btw.",
      "plans": [
        {
          "name": "Essentieel",
          "tagline": "Voor gemiste gesprekken en gesprekken buiten openingstijden.",
          "features": [
            "Minuten op basis van je belvolume",
            "Beantwoordt veelgestelde vragen",
            "Neemt boodschappen aan",
            "Samenvatting van elk gesprek"
          ],
          "featured": false
        },
        {
          "name": "Professioneel",
          "tagline": "Je complete receptie: neemt op, reserveert en plant in.",
          "features": [
            "Alles uit Essentieel",
            "Reserveringen en afspraken in je agenda",
            "Doorverbinden van gesprekken"
          ],
          "featured": true
        },
        {
          "name": "Geavanceerd",
          "tagline": "Voor bedrijven met veel volume of meerdere talen.",
          "features": [
            "Alles uit Professioneel",
            "Meerdere talen",
            "Koppeling met je reserveringssysteem of CRM"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Veelgestelde vragen",
      "faq": [
        {
          "q": "Wat kost het?",
          "a": "Dat hangt af van het aantal belminuten dat je bedrijf per maand krijgt. We bekijken samen je volume en geven je een vaste prijs voordat we beginnen."
        },
        {
          "q": "Moet ik van nummer veranderen?",
          "a": "Nee. We schakelen gesprekken van je huidige nummer door naar de assistent: allemaal, alleen de gemiste of alleen buiten openingstijden. Jij kiest."
        },
        {
          "q": "Weet de beller dat hij met een AI praat?",
          "a": "Ja. De assistent stelt zich voor als virtuele assistent van het bedrijf. Dat is eerlijk en wat de Europese regels vereisen."
        },
        {
          "q": "En als ze iets vragen wat hij niet weet?",
          "a": "Hij verzint niets. Hij noteert het en geeft de boodschap aan je door, of verbindt het gesprek door als je dat zo hebt ingesteld."
        },
        {
          "q": "Wat gebeurt er met de gegevens van de gesprekken?",
          "a": "Die worden verwerkt volgens de AVG: de beller wordt aan het begin geïnformeerd en de gegevens worden alleen gebruikt om je bedrijf te helpen."
        }
      ]
    }
  },
  "pages": {
    "estudio": {
      "eyebrow": "Studio",
      "h1": "Websites gemaakt om te blijven.",
      "prose": [
        "De naam komt van het Latijnse aeterna, en het symbool is een boom met wortels in een gesloten cirkel. We kozen het omdat het samenvat wat we willen maken: goed gebouwde websites die jaren later nog overeind staan, als niemand van de studio er meer naar kijkt.",
        "Daarom zorgen we voor wat je niet ziet: schone code, snelle pagina's en een structuur die kan groeien zonder dat hij opnieuw gebouwd moet worden.",
        "We kiezen projecten om wat ze te vertellen hebben, niet om de grootte van het budget: een vak met geschiedenis, een plek met karakter, een bedrijf dat dingen goed doet en een website nodig heeft die dat laat zien."
      ],
      "beliefsTitle": "Waar we in geloven",
      "beliefs": [
        {
          "title": "Eerst de audit",
          "body": "Voordat we iets voorstellen, kijken we wat er is en wat kapot is. Bij het laatste project was het waardevolste wat we vonden dat alle reserveringsknoppen naar een pagina leidden die niet bestond. Dat los je niet op met een mooi redesign."
        },
        {
          "title": "Geen verzonnen cijfers",
          "body": "We presenteren de beoordeling van een ander niet als de onze, we tonen geen prijzen die we niet hebben en we schrijven geen testimonials. Op korte termijn levert het minder op, maar het is het enige dat op de lange duur standhoudt."
        },
        {
          "title": "Beweging met een reden",
          "body": "Een animatie moet iets uitleggen: een hiërarchie, een samenhang, een verandering van toestand. Is ze er alleen om indruk te maken, dan kan ze weg, en ze kost ook nog batterij."
        }
      ]
    },
    "contacto": {
      "eyebrow": "Contact",
      "h1": "Laten we beginnen\nmet een gesprek.",
      "lead": "Schrijf ons via het formulier, per e-mail of via WhatsApp, wat jou het beste uitkomt."
    },
    "notFound": {
      "eyebrow": "Fout 404",
      "h1": "Deze pagina bestaat niet.",
      "lead": "Of hij heeft nooit bestaan, of we hebben hem verplaatst zonder een doorverwijzing achter te laten. Kwam je hier via een link van ons, dan ligt het aan ons.",
      "back": "Terug naar home"
    }
  }
};

const de: Dict = {
  "a11y": {
    "language": "Sprache",
    "nav": "Hauptnavigation",
    "menu": "Navigationsmenü",
    "home": "Startseite"
  },
  "nav": [
    {
      "label": "Leistungen",
      "href": "/servicios"
    },
    {
      "label": "Studio",
      "href": "/estudio"
    },
    {
      "label": "Kontakt",
      "href": "/contacto"
    }
  ],
  "cta": "Projekt starten",
  "skip": "Zum Inhalt springen",
  "common": {
    "disciplines": [
      "Design",
      "Entwicklung",
      "SEO",
      "KI-Assistent"
    ],
    "positioning": "Premium-Websites und organisches Wachstum",
    "scroll": "Scrollen",
    "perMonth": "/Monat",
    "oncePayment": "einmalig",
    "priceFrom": "ab",
    "overview": "Die Leistung",
    "customPrice": "Individueller Preis",
    "recommended": "Empfohlen",
    "customPriceNote": "je nach den Minuten, die Sie brauchen",
    "seePlans": "Pakete ansehen",
    "otherServices": "Weitere Leistungen"
  },
  "hero": {
    "eyebrow": "Unabhängiges Digitalstudio",
    "headline": "Eine bessere Website\nist erst der Anfang.",
    "support": "Wir gestalten und entwickeln Websites nach Maß und sorgen danach dafür, dass man Sie findet. Für Unternehmen, denen ihre jetzige Website zu klein geworden ist.",
    "tagline": "So gemacht, dass man Sie findet und sich bei Ihnen meldet.",
    "secondary": "Leistungen ansehen"
  },
  "cases": {
    "eyebrow": "Fallbeispiele",
    "title": "Echte Probleme,\nmaßgeschneidert gelöst.",
    "lead": "Jedes Beispiel erzählt von einem Unternehmen, was es ausgebremst hat und was wir getan haben. Wir veröffentlichen nur echte Fälle.",
    "pending": "Folgt",
    "problem": "Die Herausforderung",
    "solution": "Was wir getan haben",
    "items": [
      {
        "sector": "Branche folgt",
        "title": "Fallbeispiel noch nicht veröffentlicht",
        "problem": "Folgt: was das Unternehmen bremste und warum die Website nicht half.",
        "solution": "Folgt: was wir getan haben und was sich geändert hat, mit echten Zahlen.",
        "services": [],
        "pending": true
      },
      {
        "sector": "Branche folgt",
        "title": "Fallbeispiel noch nicht veröffentlicht",
        "problem": "Folgt: was das Unternehmen bremste und warum die Website nicht half.",
        "solution": "Folgt: was wir getan haben und was sich geändert hat, mit echten Zahlen.",
        "services": [],
        "pending": true
      },
      {
        "sector": "Branche folgt",
        "title": "Fallbeispiel noch nicht veröffentlicht",
        "problem": "Folgt: was das Unternehmen bremste und warum die Website nicht half.",
        "solution": "Folgt: was wir getan haben und was sich geändert hat, mit echten Zahlen.",
        "services": [],
        "pending": true
      }
    ]
  },
  "services": {
    "eyebrow": "Was wir tun",
    "title": "Vier Leistungen,\nein Studio.",
    "all": "Alle Leistungen ansehen"
  },
  "approach": {
    "eyebrow": "Wie wir arbeiten",
    "title": "Wir fangen nicht\nmit dem Code an.",
    "items": [
      {
        "title": "Verstehen",
        "body": "Wir schauen, was da ist, was funktioniert und was kaputt ist. Wir halten es schriftlich fest, bevor wir irgendetwas vorschlagen."
      },
      {
        "title": "Ausrichten",
        "body": "Wir wählen Struktur, Typografie, Farbe und Ton und erklären Ihnen, warum. Sie bekommen von uns eine Richtung, nicht drei zur Auswahl."
      },
      {
        "title": "Bauen",
        "body": "Wir gestalten und programmieren gleichzeitig. So sehen Sie die Website schon in den ersten Wochen laufen.",
        "service": "web"
      },
      {
        "title": "Wachsen",
        "body": "Wenn die Website online ist, machen wir weiter: Wir messen, was passiert, korrigieren, was nicht funktioniert, und arbeiten an SEO und Inhalten, damit mehr Menschen Sie finden.",
        "service": "seo"
      }
    ],
    "link": "So arbeiten wir",
    "root": ["Was da ist", "Was fehlt", "Der Ton"]
  },
  "studioHome": {
    "eyebrow": "Studio",
    "title": "Ein kleines Studio,\nganz bewusst.",
    "lead": "Aterna ist ein unabhängiges Digitalstudio. Wir sind bewusst klein, damit wir jedes Projekt selbst betreuen können.",
    "link": "Das Studio kennenlernen",
    "pillars": [
      {
        "title": "Wer gestaltet, programmiert",
        "body": "Dieselbe Person gestaltet Ihre Website, baut sie und betreut Sie. Nichts geht zwischen Teams verloren."
      },
      {
        "title": "Der Code gehört Ihnen",
        "body": "Keine Templates, keine Plugins, die jeden Monat aktualisiert werden müssen. Er ist lesbar, und jedes andere Studio kann daran weiterarbeiten."
      },
      {
        "title": "Wenige Projekte gleichzeitig",
        "body": "Wir nehmen nur wenige Aufträge gleichzeitig an. Ihr Projekt wartet also nicht hinter zehn anderen in der Schlange."
      }
    ]
  },
  "finalCta": {
    "eyebrow": "Kontakt",
    "mailLabel": "Oder schreiben Sie uns direkt",
    "title": "Passt Ihre Website\nnicht mehr zu Ihrem Unternehmen?\nLassen Sie uns reden.",
    "lead": "Erzählen Sie uns, was Sie machen und was Sie sich von Ihrer Website erwarten.",
    "nextTitle": "Wie es weitergeht",
    "next": [
      {
        "title": "Sie schreiben uns",
        "body": "Mit dem, was Sie haben: was es heute gibt und bis wann. Ein Briefing ist nicht nötig."
      },
      {
        "title": "Wir antworten",
        "body": "Immer, auch wenn es nur ist, um zu sagen, dass wir nicht das richtige Studio sind. Wenn es nicht passt, sagen wir das früh."
      },
      {
        "title": "Wir halten es schriftlich fest",
        "body": "Ein Angebot mit dem, was wir tun würden, in welchem Zeitraum und zu welchem Preis, bevor irgendetwas beginnt."
      }
    ],
    "availability": "Begrenzte Kapazität: Fragen Sie nach Terminen, wir sagen Ihnen Bescheid."
  },
  "mobile": {
    "open": "Menü",
    "close": "Schließen"
  },
  "copyEmail": {
    "copy": "Kopieren",
    "copied": "Kopiert"
  },
  "contactForm": {
    "name": "Name",
    "email": "E-Mail",
    "message": "Nachricht",
    "submit": "Nachricht senden",
    "sending": "Wird gesendet…",
    "sent": "✓ Nachricht gesendet. Wir antworten, sobald wir sie gelesen haben.",
    "error": "Senden fehlgeschlagen. Versuchen Sie es erneut oder schreiben Sie uns eine E-Mail.",
    "idle": "Wir antworten auf alles, auch wenn es nur ist, um zu sagen, dass wir nicht das richtige Studio sind.",
    "consentLegend": "DSGVO-Einwilligung",
    "consentText": "Ich willige ein, dass diese Website die von mir gesendeten Angaben speichert, damit Sie auf meine Anfrage antworten können.",
    "consentMore": "Mehr Informationen in der",
    "consentLink": "Datenschutzerklärung",
    "consentHref": "/datenschutz"
  },
  "whatsapp": {
    "message": "Hallo, ich hätte gern mehr Informationen über Aterna Studio.",
    "aria": "Per WhatsApp schreiben"
  },
  "assistant": {
    "open": "Aterna-Assistenten öffnen",
    "close": "Assistenten schließen",
    "title": "Aterna-Assistent",
    "note": "Antwortet mit dem, was auf dieser Website steht. Für Konkretes schreiben Sie uns.",
    "placeholder": "Fragen Sie, was Sie möchten…",
    "send": "Senden",
    "labels": ["Denkt nach", "Sucht", "Liest die Website", "Formuliert"],
    "answer": "Antwort",
    "restart": "Neu beginnen",
    "suggestions": ["Was kostet eine Website?", "Was umfasst SEO?", "Wie arbeiten Sie?", "Wie erreiche ich Sie?"],
    "hello": "Hallo! Ich bin der Aterna-Assistent. Ich erzähle Ihnen, was wir tun, was es kostet und wie wir arbeiten. Was möchten Sie wissen?",
    "fallback": "Das finde ich nicht auf der Website, und ich erfinde lieber nichts. Schreiben Sie uns, dann antworten wir selbst.",
    "contactLink": "Uns schreiben",
    "plansIntro": "Pakete für {service}:",
    "custom": "individueller Preis",
    "studioLink": "Das Studio kennenlernen",
    "methodLink": "So arbeiten wir",
    "plansLabel": "Pakete für {service}",
    "contactLabel": "Wie erreiche ich Sie?",
    "nearest": "Vielleicht hilft Ihnen eine davon:",
    "askWhatsApp": "Per WhatsApp fragen",
    "question": "Hallo, ich habe eine Frage: {q}",
    "flow": {
      "start": "Hilfe bei der Auswahl",
      "need": {
        "q": "Was brauchen Sie?",
        "options": [
          {
            "label": "Eine neue Website oder ein Relaunch",
            "service": "web"
          },
          {
            "label": "Bei Google gefunden werden",
            "service": "seo"
          },
          {
            "label": "Jemand, der meine Website betreut",
            "service": "mantenimiento"
          },
          {
            "label": "Anrufe annehmen lassen",
            "service": "asistente-ia"
          },
          {
            "label": "Weiß ich noch nicht",
            "service": ""
          }
        ]
      },
      "sector": {
        "q": "In welcher Branche sind Sie tätig?",
        "options": [
          "Restaurant oder Café",
          "Laden",
          "Gesundheit oder Wellness",
          "Dienstleistungen für Unternehmen",
          "Etwas anderes"
        ]
      },
      "when": {
        "q": "Bis wann brauchen Sie es?",
        "options": [
          "So bald wie möglich",
          "In den nächsten Monaten",
          "Ich schaue mich nur um"
        ]
      },
      "summary": "Das passt zu Ihnen: {service}, {price}. Die Nachricht ist vorbereitet: Schicken Sie sie per WhatsApp oder über das Formular, und wir melden uns mit einem Vorschlag.",
      "summaryUnsure": "Dann schauen wir es uns gemeinsam an. Die Nachricht ist vorbereitet: Schicken Sie sie per WhatsApp oder über das Formular, und wir sagen Ihnen, was wir in Ihrem Fall tun würden.",
      "intro": "Hallo, ich schreibe über den Assistenten auf Ihrer Website.",
      "fields": {
        "service": "Interesse an",
        "sector": "Branche",
        "when": "Zeitrahmen"
      },
      "unsure": "weiß ich noch nicht",
      "whatsapp": "Per WhatsApp senden",
      "form": "Formular verwenden"
    }
  },
  "servicePages": {
    "index": {
      "eyebrow": "Leistungen",
      "h1": "Vier Wege,\nzusammenzuarbeiten.",
      "lead": "Wir gestalten und bauen Ihre Website, halten sie lebendig, sorgen dafür, dass man Sie findet, und nehmen Ihre Anrufe an, wenn Sie es nicht können. Beginnen Sie mit einer Leistung und ergänzen Sie die anderen, wann Sie wollen.",
      "cards": [
        {
          "slug": "web",
          "kicker": "Einmalig",
          "title": "Webdesign und -entwicklung",
          "body": "Eine Website, die für Ihr Unternehmen gemacht ist und nicht für irgendeines. Design, Art Direction und eigener Code.",
          "cta": "Webdesign ansehen"
        },
        {
          "slug": "seo",
          "kicker": "Monatlich",
          "title": "SEO und organisches Wachstum",
          "body": "Gefunden werden von Menschen, die schon nach dem suchen, was Sie anbieten. Monatliche Arbeit mit einem klaren Bericht, was sich verändert.",
          "cta": "SEO ansehen"
        },
        {
          "slug": "mantenimiento",
          "kicker": "Monatlich",
          "title": "Wartung und Support",
          "body": "Wir kümmern uns um Hosting, Backups und Updates, damit Sie sich darum keine Gedanken machen müssen.",
          "cta": "Wartung ansehen"
        },
        {
          "slug": "asistente-ia",
          "kicker": "Monatlich",
          "title": "KI-Telefonassistent",
          "body": "Ein Sprachassistent, der die Anrufe Ihres Unternehmens rund um die Uhr annimmt, auch wenn Sie beschäftigt sind oder schon geschlossen haben.",
          "cta": "KI-Assistent ansehen"
        }
      ]
    },
    "web": {
      "eyebrow": "Webdesign und -entwicklung · Einmalig",
      "h1": "Eine Website, die wirklich\nzu Ihrem Unternehmen passt.",
      "lead": "Webdesign, Art Direction und Entwicklung nach Maß, ohne Templates oder Plugins, die gepflegt werden müssen. Wenn wir fertig sind, gehört der Code Ihnen.",
      "intro": [
        "Viele Websites ähneln sich, weil sie aus derselben Handvoll Templates stammen. Wir beginnen mit einer anderen Frage: Was soll Ihre Website erreichen? Gefunden werden, Buchungen bekommen, verkaufen. Wenn das klar ist, entscheiden wir über Struktur, Art Direction und Code."
      ],
      "includesTitle": "Was enthalten ist",
      "includes": [
        "Audit und Strategie, bevor wir irgendetwas gestalten",
        "Art Direction nach Maß: Typografie, Farbe, Bild und Ton",
        "Design des gesamten Erlebnisses, vom Desktop bis zum Smartphone",
        "Eigener, schneller und barrierearmer Code (Core Web Vitals als Ziel)",
        "Technisches Basis-SEO und strukturierte Daten",
        "Veröffentlichung, Tests und Übergabe des Codes"
      ],
      "reportTitle": "",
      "report": "",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Pakete",
      "plansNote": "Richtpreis je nach Umfang. Zzgl. MwSt.",
      "plans": [
        {
          "name": "Essenziell",
          "tagline": "Ein Onepager oder eine kleine Website für einen guten Start.",
          "features": [
            "Bis zu 3 Abschnitte",
            "Design nach Maß",
            "Kontaktformular",
            "Responsiv und barrierearm"
          ],
          "featured": false
        },
        {
          "name": "Nach Maß",
          "tagline": "Was wir am häufigsten bauen: eine vollständige Website mit mehreren Seiten.",
          "features": [
            "Seiten nach Maß ohne feste Grenze",
            "Vollständige Art Direction",
            "Motion und Interaktion, wo sie etwas beitragen",
            "Technisches SEO + strukturierte Daten"
          ],
          "featured": true
        },
        {
          "name": "Premium",
          "tagline": "Für Websites, die mehr können müssen.",
          "features": [
            "Mehrsprachig",
            "Buchungen oder Shop",
            "3D-Erlebnisse / fortgeschrittene Motion",
            "Alles oben Genannte"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Häufige Fragen",
      "faq": [
        {
          "q": "Wie lange dauert es?",
          "a": "Das hängt vom Umfang ab, aber eine Website nach Maß dauert meist 3 bis 6 Wochen, sobald wir die Inhalte haben. Sie bekommen einen Zeitplan, bevor wir beginnen."
        },
        {
          "q": "Gehört der Code mir?",
          "a": "Ja. Wir übergeben Ihnen den Code, und er gehört Ihnen. Er ist so geschrieben, dass ein anderes Studio damit weiterarbeiten kann, falls Sie einmal wechseln."
        },
        {
          "q": "Ist die Wartung enthalten?",
          "a": "Die Wartung (Hosting, Backups, Updates, Support) ist eine separate, optionale Leistung. Sie können sie buchen oder die Website selbst betreuen."
        }
      ]
    },
    "seo": {
      "eyebrow": "SEO und organisches Wachstum · Monatlich",
      "h1": "SEO und organisches Wachstum\nfür lokale Unternehmen.",
      "lead": "Sie können eine großartige Website haben, aber wenn niemand sie findet, bringt sie Ihnen wenig. SEO sorgt dafür, dass Sie auftauchen, wenn jemand nach dem sucht, was Sie machen.",
      "intro": [
        "Wir versprechen Ihnen Arbeit, die jeden Monat erledigt und klar erklärt wird. SEO steigt nicht in einer geraden Linie, sondern in Sprüngen, und das sehen Sie Monat für Monat an echten Zahlen.",
        "Beim organischen Wachstum konzentrieren wir uns vor allem auf lokale Sichtbarkeit: Hotels, Weingüter, Restaurants und jedes Unternehmen, das bei Suchen wie „in meiner Nähe“ auftauchen muss."
      ],
      "includesTitle": "Woran wir jeden Monat arbeiten",
      "includes": [
        "Technisches SEO und Zustand der Website",
        "Suchanfragen und Suchintention (Keyword-Recherche)",
        "On-Page-Optimierung und Inhalte",
        "Lokale Sichtbarkeit und Google-Unternehmensprofil",
        "Interne Verlinkung und Autorität",
        "Messung, Bericht und nächste Schritte"
      ],
      "reportTitle": "Wie wir berichten",
      "report": "Jeden Monat bekommen Sie dasselbe Schema, auch wenn der Monat ruhig war: was wir gefunden haben, was wir getan haben, was sich geändert hat, was nicht und was wir als Nächstes probieren.",
      "examplesTitle": "Ein Beispiel für das, was Sie bekommen",
      "examplesLead": "So sehen das Audit und der Bericht aus, die wir erstellen, in zwei verschiedenen Branchen:",
      "examples": [
        {
          "label": "Renovierungsbetrieb",
          "title": "Solera Reformas",
          "href": "/ejemplos/reformas-sevilla/"
        },
        {
          "label": "Steuerberatung",
          "title": "Nexo Asesores",
          "href": "/ejemplos/nexo-asesores/"
        }
      ],
      "plansTitle": "Pakete",
      "plansNote": "Monatliche Gebühr, Mindestlaufzeit 3 Monate. Zzgl. MwSt. Sie können jederzeit kündigen: Die Website bleibt Ihre.",
      "plans": [
        {
          "name": "Pflege",
          "tagline": "Das Bestehende pflegen und Schritt für Schritt aufsteigen.",
          "features": [
            "Google-Unternehmensprofil",
            "Technisches SEO und Monitoring",
            "1 Inhalt pro Monat",
            "Monatsbericht"
          ],
          "featured": false
        },
        {
          "name": "Wachstum",
          "tagline": "Monat für Monat in Ihrer Region nach oben kommen.",
          "features": [
            "Alles aus Pflege",
            "Seiten für Regionen und Leistungen",
            "Mehr Inhalte und Bewertungen",
            "Erweiterte strukturierte Daten"
          ],
          "featured": true
        },
        {
          "name": "Dominanz",
          "tagline": "Der erste Name werden, der in Ihrer Region auftaucht.",
          "features": [
            "Alles aus Wachstum",
            "Wöchentliche Inhalte",
            "Links und lokale Presse",
            "Conversion-Optimierung"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Häufige Fragen",
      "faq": [
        {
          "q": "Wann sieht man Ergebnisse?",
          "a": "SEO braucht Zeit: Üblich ist, ab dem dritten Monat Bewegung zu sehen, und deutlicher ab dem sechsten. Deshalb beträgt die Mindestlaufzeit 3 Monate; weniger zu berechnen wäre nicht ehrlich."
        },
        {
          "q": "Garantieren Sie Platz eins?",
          "a": "Nein, und seien Sie vorsichtig bei allen, die das versprechen. Niemand kontrolliert den Algorithmus von Google. Was wir garantieren, ist echte Arbeit jeden Monat und ein ehrlicher Bericht darüber, was sich ändert."
        },
        {
          "q": "Muss meine Website von Ihnen gebaut sein?",
          "a": "Nein. Wir können SEO für Ihre aktuelle Website machen, ob wir sie gebaut haben oder nicht."
        }
      ]
    },
    "care": {
      "eyebrow": "Wartung und Support · Monatlich",
      "h1": "Ihre Website läuft,\nohne dass Sie daran denken müssen.",
      "lead": "Hosting, Backups, Updates und Support. Wenn etwas ausfällt, merken wir es vor Ihnen.",
      "intro": [
        "Ohne Wartung wird eine Website nach und nach langsamer und veraltet, bis eines Tages etwas nicht mehr funktioniert. Mit dieser Leistung ist das Technische unsere Sache.",
        "Sie ist unabhängig vom SEO: Eine Website am Leben zu halten und sie wachsen zu lassen sind zwei verschiedene Dinge, und wir zwingen Sie nicht, beides zu bündeln."
      ],
      "includesTitle": "Was enthalten ist",
      "includes": [
        "Verwaltetes Hosting und Domain",
        "Automatische Backups",
        "Updates und Sicherheit",
        "Überwachung von Ausfällen und Leistung",
        "Kleine inhaltliche Änderungen",
        "Support per E-Mail"
      ],
      "reportTitle": "",
      "report": "",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Pakete",
      "plansNote": "Monatliche Gebühr, ohne Mindestlaufzeit. Zzgl. MwSt.",
      "plans": [
        {
          "name": "Essenziell",
          "tagline": "Das Nötigste für eine gesunde und sichere Website.",
          "features": [
            "Hosting und Domain",
            "Backups",
            "Updates und Sicherheit",
            "Monitoring"
          ],
          "featured": false
        },
        {
          "name": "Komplett",
          "tagline": "Dazu Änderungen und bevorzugter Support.",
          "features": [
            "Alles aus Essenziell",
            "Kleine inhaltliche Änderungen",
            "Bevorzugter Support",
            "Statusbericht"
          ],
          "featured": true
        }
      ],
      "faqTitle": "Häufige Fragen",
      "faq": [
        {
          "q": "Ist das Pflicht?",
          "a": "Nein. Sie können Ihre Website selbst betreuen; der Code gehört Ihnen. Diese Leistung gibt es für alle, die sich lieber um nichts Technisches kümmern möchten."
        },
        {
          "q": "Und wenn ich kündigen möchte?",
          "a": "Ohne Mindestlaufzeit: Sie kündigen, wann Sie wollen. Wir helfen Ihnen, die Website dorthin umzuziehen, wohin Sie möchten."
        }
      ]
    },
    "voice": {
      "eyebrow": "KI-Telefonassistent · Monatlich",
      "h1": "Ihr Unternehmen\nbleibt erreichbar.",
      "lead": "Ein KI-Sprachassistent, der im Namen Ihres Unternehmens Anrufe annimmt, rund um die Uhr: Er beantwortet Fragen, nimmt Reservierungen oder Termine an und gibt Ihnen die Nachricht weiter.",
      "intro": [
        "Wenn Sie bei einem Kunden sind, in der Küche, auf der Baustelle oder geschlossen haben, klingelt das Telefon weiter. Und wer anruft und niemanden erreicht, versucht es meist beim Nächsten auf der Liste.",
        "Wir richten einen Assistenten ein, der mit der Stimme und im Ton Ihres Unternehmens spricht, Ihre Öffnungszeiten, Leistungen und Preise kennt und weiß, wann er den Anruf an Sie weitergeben muss."
      ],
      "includesTitle": "Was enthalten ist",
      "includes": [
        "Einrichtung mit den echten Informationen Ihres Unternehmens",
        "Natürliche Stimme auf Spanisch (und in weiteren Sprachen, wenn Sie sie brauchen)",
        "Erreichbar rund um die Uhr, auch am Wochenende und an Feiertagen",
        "Reservierungen, Termine oder Nachrichten annehmen",
        "Weiterleitung auf Ihr Handy, wenn der Fall es erfordert",
        "Zusammenfassung jedes Anrufs per E-Mail oder WhatsApp"
      ],
      "reportTitle": "Wie Sie wissen, was passiert",
      "report": "Jeder Anruf wird mit einer Zusammenfassung festgehalten: wer angerufen hat, was er wollte und was ihm geantwortet wurde. Wir gehen die Gespräche mit Ihnen durch und passen den Assistenten an, wenn etwas nicht gut beantwortet wird.",
      "examplesTitle": "",
      "examplesLead": "",
      "examples": [],
      "plansTitle": "Pakete",
      "plansNote": "Der Preis jedes Pakets richtet sich individuell nach den Gesprächsminuten, die Ihr Unternehmen braucht. Sie bekommen ihn fest, bevor wir beginnen. Einrichtung und Konfiguration: 290 € (einmalig). Monatliche Gebühr, Mindestlaufzeit 3 Monate. Zzgl. MwSt.",
      "plans": [
        {
          "name": "Essenziell",
          "tagline": "Für verpasste Anrufe und Anrufe außerhalb der Öffnungszeiten.",
          "features": [
            "Minuten nach Ihrem Anrufvolumen",
            "Beantwortet häufige Fragen",
            "Nimmt Nachrichten an",
            "Zusammenfassung jedes Anrufs"
          ],
          "featured": false
        },
        {
          "name": "Professionell",
          "tagline": "Ihr kompletter Empfang: nimmt an, reserviert und plant.",
          "features": [
            "Alles aus Essenziell",
            "Reservierungen und Termine in Ihrem Kalender",
            "Anrufweiterleitung"
          ],
          "featured": true
        },
        {
          "name": "Fortgeschritten",
          "tagline": "Für Unternehmen mit viel Volumen oder mehreren Sprachen.",
          "features": [
            "Alles aus Professionell",
            "Mehrere Sprachen",
            "Anbindung an Ihr Buchungssystem oder CRM"
          ],
          "featured": false
        }
      ],
      "faqTitle": "Häufige Fragen",
      "faq": [
        {
          "q": "Was kostet es?",
          "a": "Das hängt davon ab, wie viele Gesprächsminuten Ihr Unternehmen im Monat bekommt. Wir schauen uns Ihr Volumen gemeinsam an und nennen Ihnen einen Festpreis, bevor wir beginnen."
        },
        {
          "q": "Muss ich meine Nummer wechseln?",
          "a": "Nein. Wir leiten die Anrufe Ihrer bisherigen Nummer an den Assistenten weiter: alle, nur die, die Sie nicht annehmen, oder nur außerhalb der Öffnungszeiten. Sie entscheiden."
        },
        {
          "q": "Weiß der Anrufer, dass er mit einer KI spricht?",
          "a": "Ja. Der Assistent stellt sich als virtueller Assistent des Unternehmens vor. Das ist ehrlich und das, was die europäischen Regeln verlangen."
        },
        {
          "q": "Und wenn er etwas gefragt wird, das er nicht weiß?",
          "a": "Er erfindet nichts. Er notiert es und gibt Ihnen die Nachricht weiter, oder er leitet den Anruf an Sie weiter, wenn Sie es so eingestellt haben."
        },
        {
          "q": "Was passiert mit den Daten der Anrufe?",
          "a": "Sie werden gemäß DSGVO verarbeitet: Der Anrufer wird zu Beginn informiert, und die Daten werden nur genutzt, um Ihr Unternehmen zu unterstützen."
        }
      ]
    }
  },
  "pages": {
    "estudio": {
      "eyebrow": "Studio",
      "h1": "Websites, die bleiben.",
      "prose": [
        "Der Name kommt vom lateinischen aeterna, das Symbol ist ein Baum mit Wurzeln in einem geschlossenen Kreis. Wir haben es gewählt, weil es zusammenfasst, was wir machen wollen: gut gebaute Websites, die auch Jahre später noch stehen, wenn im Studio längst niemand mehr hinschaut.",
        "Deshalb kümmern wir uns um das, was man nicht sieht: sauberen Code, schnelle Seiten und eine Struktur, die wachsen kann, ohne neu gebaut zu werden.",
        "Wir wählen Projekte nach dem, was sie zu erzählen haben, nicht nach der Größe des Budgets: ein Handwerk mit Geschichte, ein Ort mit Charakter, ein Unternehmen, das seine Sache gut macht und eine Website braucht, die das zeigt."
      ],
      "beliefsTitle": "Woran wir glauben",
      "beliefs": [
        {
          "title": "Zuerst das Audit",
          "body": "Bevor wir etwas vorschlagen, schauen wir, was da ist und was kaputt ist. Beim letzten Projekt war das Wertvollste, was wir fanden, dass alle Buchungsbuttons auf eine Seite führten, die es nicht gab. Das behebt kein hübsches Redesign."
        },
        {
          "title": "Keine erfundenen Zahlen",
          "body": "Wir geben die Bewertung anderer nicht als unsere aus, zeigen keine Auszeichnungen, die wir nicht haben, und schreiben keine Testimonials. Kurzfristig bringt das weniger, aber nur so trägt die Arbeit auf Dauer."
        },
        {
          "title": "Bewegung mit Grund",
          "body": "Eine Animation muss etwas erklären: eine Hierarchie, einen Zusammenhang, einen Zustandswechsel. Ist sie nur da, um zu beeindrucken, ist sie überflüssig und kostet obendrein Akku."
        }
      ]
    },
    "contacto": {
      "eyebrow": "Kontakt",
      "h1": "Fangen wir mit\neinem Gespräch an.",
      "lead": "Schreiben Sie uns über das Formular, per E-Mail oder per WhatsApp, ganz wie es Ihnen lieber ist."
    },
    "notFound": {
      "eyebrow": "Fehler 404",
      "h1": "Diese Seite gibt es nicht.",
      "lead": "Entweder hat es sie nie gegeben, oder wir haben sie verschoben und keine Weiterleitung hinterlassen. Wenn Sie über einen unserer Links hier gelandet sind, liegt es an uns.",
      "back": "Zur Startseite"
    }
  }
};

export const LOCALES = ["es", "en", "nl", "de"] as const;
export type Locale = (typeof LOCALES)[number];

/** El español vive en la raíz; los demás idiomas, bajo /en, /nl y /de. */
export const DEFAULT_LOCALE: Locale = "es";
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

/** Ruta de `path` (sin idioma, p. ej. "/servicios" o "/#metodo") en `locale`. */
export function localePath(path: string, locale: Locale) {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/")) return path;
  return path === "/" || path.startsWith("/#") ? `/${locale}${path.slice(1)}` : `/${locale}${path}`;
}

/** Quita el prefijo de idioma de una ruta: "/en/estudio" -> "/estudio". */
export function stripLocale(pathname: string) {
  const seg = pathname.split("/")[1] ?? "";
  if (seg === DEFAULT_LOCALE || !isLocale(seg)) return pathname;
  return pathname.slice(seg.length + 1) || "/";
}

/** Nombre de cada idioma en su propio idioma: así se encuentra en el selector. */
export const LOCALE_NAMES: Record<Locale, string> = {
  es: "Español",
  en: "English",
  nl: "Nederlands",
  de: "Deutsch",
};

/** Convención de números y moneda de cada idioma (Intl). */
export const LOCALE_TAGS: Record<Locale, string> = {
  es: "es-ES",
  en: "en-GB",
  nl: "nl-NL",
  de: "de-DE",
};

export const dict: Record<Locale, Dict> = { es, en, nl, de };
