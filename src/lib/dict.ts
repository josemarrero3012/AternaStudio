// Textos de la web en español (por defecto, y el que se exporta en el HTML)
// e inglés (se aplica en el navegador con el selector ES/EN).
// Los saltos de línea (\n) en los titulares son cortes intencionados.

const es = {
  "langName": {
    "es": "Español",
    "en": "Inglés"
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
    "support": "Diseñamos, construimos y hacemos crecer webs de alto rendimiento para negocios que han superado su presencia actual.",
    "tagline": "Diseñadas para que te encuentren. Construidas para convertir.",
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
        "body": "Decidimos el territorio: estructura, tipografía, color y tono. Una dirección, defendida."
      },
      {
        "title": "Construir",
        "body": "Diseño y código avanzan juntos, no uno detrás del otro. La web toma forma desde el principio.",
        "service": "web"
      },
      {
        "title": "Crecer",
        "body": "Publicamos, medimos y mejoramos. SEO, contenido y visibilidad para que la web no se quede quieta el día del lanzamiento.",
        "service": "seo"
      }
    ] as { title: string; body: string; service?: string }[],
    "link": "Ver cómo trabajamos",
    "desk": {
      "label": "Lo que hay antes del código",
      "brief": {
        "label": "Por escrito",
        "lines": ["Qué hay", "Qué funciona", "Qué está roto"]
      },
      "direction": {
        "label": "Dirección",
        "fonts": "Fraunces · Archivo"
      },
      "code": {
        "label": "Código",
        "off": "Llega en la fase 03",
        "on": "Ahora sí"
      }
    }
  },
  "studioHome": {
    "eyebrow": "Estudio",
    "title": "Un estudio pequeño,\npor decisión.",
    "lead": "Aterna es un estudio digital independiente. Ser pequeños no es una limitación: es lo que nos permite trabajar así.",
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
        "body": "No competimos en volumen. Cada proyecto tiene la atención que necesita, de principio a fin."
      }
    ]
  },
  "finalCta": {
    "eyebrow": "Contacto",
    "mailLabel": "O escríbenos directamente",
    "title": "Si tu web ya no\nrepresenta a tu negocio,\nhablemos.",
    "lead": "Cuéntanos qué haces y qué quieres que tu presencia digital consiga.",
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
    "again": "Otra pregunta",
    "suggestions": ["¿Cuánto cuesta una web?", "¿Qué incluye el SEO?", "¿Cómo trabajáis?", "¿Cómo os contacto?"],
    "hello": "¡Hola! Soy el asistente de Aterna. Te cuento lo que hacemos, cuánto cuesta y cómo trabajamos. ¿Qué quieres saber?",
    "fallback": "Eso no lo encuentro en la web y prefiero no inventármelo. Escríbenos y te respondemos nosotros.",
    "contactLink": "Escribirnos",
    "plansIntro": "Planes de {service}:",
    "custom": "precio personalizado",
    "studioLink": "Conocer el estudio",
    "methodLink": "Ver cómo trabajamos"
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
          "body": "La web a medida que pone tu negocio a la altura de lo que vale. Diseño, dirección de arte y código propio.",
          "cta": "Ver diseño web"
        },
        {
          "slug": "seo",
          "kicker": "Cuota mensual",
          "title": "SEO y crecimiento orgánico",
          "body": "Que te encuentren los que ya te están buscando. Trabajo mensual, medido y reportado con honestidad.",
          "cta": "Ver SEO"
        },
        {
          "slug": "mantenimiento",
          "kicker": "Cuota mensual",
          "title": "Mantenimiento y soporte",
          "body": "Tu web siempre rápida, segura y al día. Sin que tengas que pensar en nada técnico.",
          "cta": "Ver mantenimiento"
        },
        {
          "slug": "asistente-ia",
          "kicker": "Cuota mensual",
          "title": "Asistente telefónico con IA",
          "body": "Un asistente de voz que contesta las llamadas de tu negocio 24 horas al día. Ninguna llamada sin respuesta.",
          "cta": "Ver asistente IA"
        }
      ]
    },
    "web": {
      "eyebrow": "Diseño y desarrollo web · Pago único",
      "h1": "Una web a la altura\ndel negocio que ya eres.",
      "lead": "Diseño, dirección de arte y desarrollo a medida. Sin plantillas, sin plugins que mantener. El código es tuyo.",
      "intro": [
        "La mayoría de las webs se parecen entre sí porque salen del mismo puñado de plantillas. La tuya no. Partimos de qué tiene que conseguir —que te encuentren, que te reserven, que te compren— y a partir de ahí decidimos estructura, dirección de arte y código."
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
          "tagline": "One-pager o web pequeña para empezar con nivel.",
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
          "tagline": "El estándar Aterna: web multipágina completa.",
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
          "tagline": "Proyectos con más piezas moviéndose.",
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
          "a": "Sí. Entregamos código propio, limpio y mantenible. Es tuyo y cualquier otro estudio puede continuarlo. No te atamos a nosotros."
        },
        {
          "q": "¿Incluye el mantenimiento?",
          "a": "El mantenimiento (hosting, copias, actualizaciones, soporte) es un servicio aparte y opcional. Puedes contratarlo o llevar la web por tu cuenta."
        }
      ]
    },
    "seo": {
      "eyebrow": "SEO y crecimiento orgánico · Cuota mensual",
      "h1": "Especialistas en SEO\ny en crecimiento orgánico.",
      "lead": "Una web excelente que nadie encuentra sigue teniendo el mismo problema. El SEO es la parte que hace que aparezcas cuando te buscan.",
      "intro": [
        "Lo que prometemos es trabajo hecho, medido y contado con claridad. El SEO sube en escalones, no en línea recta, y lo verás mes a mes con datos reales.",
        "Trabajamos el crecimiento orgánico con especial foco en la visibilidad local —para hoteles, bodegas, restaurantes y negocios que se juegan mucho en «cerca de mí»."
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
      "report": "Cada mes, el mismo esquema, aunque el mes haya sido plano: esto encontramos, esto hicimos, esto cambió, esto no, esto probamos ahora. Sin humo.",
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
          "tagline": "Mantener viva la presencia y ganar terreno poco a poco.",
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
          "tagline": "Ganar terreno local de forma constante.",
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
          "tagline": "Ser la referencia de tu comarca.",
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
      "h1": "Tu web, siempre\nrápida, segura y al día.",
      "lead": "Hosting, copias, actualizaciones y soporte. Tú te ocupas de tu negocio; nosotros, de que la web no te dé un solo dolor de cabeza.",
      "intro": [
        "Una web necesita mantenimiento para seguir rindiendo. Este servicio se encarga de todo lo técnico para que no tengas que pensar en ello.",
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
      "h1": "Tu negocio contesta\nal teléfono. Siempre.",
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
          "a": "Depende de los minutos de llamada que reciba tu negocio al mes. Vemos juntos tu volumen y te damos un precio cerrado antes de empezar, sin sorpresas."
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
        "El nombre viene de aeterna. El símbolo es un árbol con raíces dentro de un círculo cerrado. No es decoración: es lo que vendemos —una web bien construida sigue en pie cuando el estudio que la hizo ya no está mirando.",
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
          "body": "No marcamos como propia la valoración de un tercero, no ponemos premios que no tenemos y no escribimos testimonios. Da peor resultado a corto plazo y es la única forma de sostener el trabajo a largo."
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
  "langName": {
    "es": "Spanish",
    "en": "English"
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
    "support": "We design, build and grow high-performance websites for businesses that have outgrown their digital presence.",
    "tagline": "Designed to be found. Built to convert.",
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
        "body": "We set the territory: structure, typography, colour and tone. One direction, defended."
      },
      {
        "title": "Build",
        "body": "Design and code move together, not one behind the other. The site takes shape from the start.",
        "service": "web"
      },
      {
        "title": "Grow",
        "body": "We publish, measure and improve. SEO, content and visibility, so the site doesn't go quiet the day it launches.",
        "service": "seo"
      }
    ],
    "link": "See how we work",
    "desk": {
      "label": "What comes before the code",
      "brief": {
        "label": "In writing",
        "lines": ["What's there", "What works", "What's broken"]
      },
      "direction": {
        "label": "Direction",
        "fonts": "Fraunces · Archivo"
      },
      "code": {
        "label": "Code",
        "off": "Arrives in phase 03",
        "on": "Now it's time"
      }
    }
  },
  "studioHome": {
    "eyebrow": "Studio",
    "title": "A small studio,\nby choice.",
    "lead": "Aterna is an independent digital studio. Being small isn’t a limitation: it’s what lets us work this way.",
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
        "body": "We don't compete on volume. Each project gets the attention it needs, from start to finish."
      }
    ]
  },
  "finalCta": {
    "eyebrow": "Contact",
    "mailLabel": "Or write to us directly",
    "title": "If your website no longer\nrepresents your business,\nlet’s talk.",
    "lead": "Tell us what you do and what you want your digital presence to achieve.",
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
    "again": "Another question",
    "suggestions": ["How much is a website?", "What does SEO include?", "How do you work?", "How do I contact you?"],
    "hello": "Hi! I'm the Aterna assistant. I can tell you what we do, what it costs and how we work. What would you like to know?",
    "fallback": "I can't find that on the website and I'd rather not make it up. Write to us and we'll answer ourselves.",
    "contactLink": "Write to us",
    "plansIntro": "{service} plans:",
    "custom": "custom pricing",
    "studioLink": "About the studio",
    "methodLink": "See how we work"
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
          "body": "The bespoke website that brings your business up to the level it deserves. Design, art direction and our own code.",
          "cta": "See web design"
        },
        {
          "slug": "seo",
          "kicker": "Monthly",
          "title": "SEO & organic growth",
          "body": "Get found by the people already searching for you. Monthly work, measured and reported honestly.",
          "cta": "See SEO"
        },
        {
          "slug": "mantenimiento",
          "kicker": "Monthly",
          "title": "Maintenance & support",
          "body": "Your site always fast, secure and up to date. Without having to think about anything technical.",
          "cta": "See maintenance"
        },
        {
          "slug": "asistente-ia",
          "kicker": "Monthly",
          "title": "AI phone assistant",
          "body": "A voice assistant that answers your business’s calls 24 hours a day. No call left unanswered.",
          "cta": "See AI assistant"
        }
      ]
    },
    "web": {
      "eyebrow": "Web design & development · One-time",
      "h1": "A website worthy of\nthe business you already are.",
      "lead": "Design, art direction and custom development. No templates, no plugins to maintain. The code is yours.",
      "intro": [
        "Most websites look alike because they come from the same handful of templates. Yours won’t. We start from what it needs to achieve —get found, get booked, get bought— and from there we decide structure, art direction and code."
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
          "tagline": "A one-pager or small site to start with real quality.",
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
          "tagline": "The Aterna standard: a full multipage site.",
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
          "tagline": "Projects with more moving parts.",
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
          "a": "Yes. We deliver our own clean, maintainable code. It’s yours and any other studio can continue it. We don’t lock you in."
        },
        {
          "q": "Is maintenance included?",
          "a": "Maintenance (hosting, backups, updates, support) is a separate, optional service. You can take it on or run the site yourself."
        }
      ]
    },
    "seo": {
      "eyebrow": "SEO & organic growth · Monthly",
      "h1": "SEO and organic growth\nspecialists.",
      "lead": "An excellent website nobody finds still has the same problem. SEO is the part that makes you show up when they search for you.",
      "intro": [
        "What we promise is work done, measured and told clearly. SEO climbs in steps, not a straight line, and you’ll see it month by month with real data.",
        "We work on organic growth with a strong focus on local visibility —for hotels, wineries, restaurants and businesses with a lot riding on “near me”."
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
      "report": "Every month, the same structure, even when the month was flat: this is what we found, what we did, what changed, what didn’t, what we’ll try now. No smoke.",
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
          "tagline": "Keep the presence alive and gain ground steadily.",
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
          "tagline": "Gain local ground consistently.",
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
          "tagline": "Become the reference in your area.",
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
      "h1": "Your site, always\nfast, secure and current.",
      "lead": "Hosting, backups, updates and support. You take care of your business; we make sure the website never gives you a headache.",
      "intro": [
        "A website needs maintenance to keep performing. This service handles everything technical so you don’t have to think about it.",
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
      "h1": "Your business answers\nthe phone. Always.",
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
          "a": "It depends on how many call minutes your business gets each month. We look at your volume together and give you a fixed price before we start, no surprises."
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
        "The name comes from aeterna. The symbol is a tree with roots inside a closed circle. It's not decoration: it's what we sell — a well-built website is still standing when the studio that made it is no longer watching.",
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
          "body": "We don't pass off someone else's rating as our own, we don't display awards we don't have and we don't write testimonials. It performs worse in the short term and it's the only way to sustain the work long term."
        },
        {
          "title": "Motion with a reason",
          "body": "An animation has to explain something: a hierarchy, a continuity, a change of state. If it's only there to impress, it's excess — and it costs battery."
        }
      ]
    },
    "contacto": {
      "eyebrow": "Contact",
      "h1": "Let’s start with\na conversation.",
      "lead": "Write to us through the form, by email or on WhatsApp — whichever suits you."
    },
    "notFound": {
      "eyebrow": "Error 404",
      "h1": "This page doesn't exist.",
      "lead": "Either it never existed, or we moved it and didn't leave a redirect. If you got here from one of our links, that's on us.",
      "back": "Back to home"
    }
  }
};

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const dict: Record<Locale, Dict> = { es, en };
