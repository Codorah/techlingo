// TechLingo — contenu pédagogique
const TECH_VOCABULARY = [
  {
    id: 'devops',
    term: 'DevOps',
    phonetic: '/ˈdevɒps/',
    category: 'DevOps',
    partOfSpeech: 'noun',
    enDef: 'A combination of software development (Dev) and IT operations (Ops) aimed at shortening the systems development life cycle and providing continuous delivery with high software quality.',
    frDef: 'Culture et ensemble de pratiques unissant les développeurs et les administrateurs système pour automatiser et accélérer le déploiement fiable d’applications.',
    examples: [
      {
        en: 'Our team adopted DevOps practices to reduce deployment failures by 40%.',
        fr: 'Notre équipe a adopté des pratiques DevOps pour réduire de 40% les échecs de déploiement.'
      },
      {
        en: 'The CI/CD pipeline is the backbone of our DevOps workflow.',
        fr: 'Le pipeline CI/CD est la colonne vertébrale de notre flux de travail DevOps.'
      }
    ],
    takeaway: 'DevOps = Collaboration continue + Automatisation + Livraison rapide.',
    quiz: {
      question: "Que signifie concrètement 'Deploy to production' en contexte DevOps ?",
      options: [
        "Mettre l'application à la disposition des utilisateurs finaux",
        "Supprimer les bugs du code local",
        "Écrire la documentation utilisateur",
        "Créer une nouvelle branche git temporaire"
      ],
      correctIndex: 0,
      explanation: "Déployer en production (deploy to prod) signifie envoyer la nouvelle version du code sur les serveurs réels accessibles aux utilisateurs."
    }
  },
  {
    id: 'idempotent',
    term: 'Idempotent',
    phonetic: '/ˌaɪdəmˈpoʊtənt/',
    category: 'Backend',
    partOfSpeech: 'adjective',
    enDef: 'An operation that produces the same result no matter how many times it is executed with the same parameters.',
    frDef: 'Qualifie une opération (notamment une requête HTTP PUT ou DELETE) produisant exactement le même effet qu’on l’exécute une ou plusieurs fois.',
    examples: [
      {
        en: 'HTTP GET, PUT, and DELETE methods must be idempotent according to the REST specification.',
        fr: 'Les méthodes HTTP GET, PUT et DELETE doivent être idempotentes selon la spécification REST.'
      },
      {
        en: 'To prevent duplicate payments, our payment webhook endpoint is strictly idempotent.',
        fr: 'Pour éviter les paiements en double, notre endpoint de webhook est strictement idempotent.'
      }
    ],
    takeaway: 'Idempotent = 1 exécution ou 100 exécutions = Même résultat final garanti.',
    quiz: {
      question: "Laquelle de ces requêtes HTTP est par convention NON-idempotente ?",
      options: [
        "POST (création d'une nouvelle ressource)",
        "GET (lecture d'une ressource)",
        "PUT (remplacement complet)",
        "DELETE (suppression d'une ressource)"
      ],
      correctIndex: 0,
      explanation: "POST n'est pas idempotent car appeler POST 5 fois créera 5 nouvelles entrées distinctes en base de données."
    }
  },
  {
    id: 'pipeline',
    term: 'CI/CD Pipeline',
    phonetic: '/ˌsiː aɪ ˌsiː ˈdiː ˈpaɪplaɪn/',
    category: 'DevOps',
    partOfSpeech: 'noun',
    enDef: 'Continuous Integration & Continuous Delivery: An automated chain of steps that tests, builds, and deploys code changes to production.',
    frDef: 'Chaîne d’automatisation qui teste les tests unitaires, compile le code et livre l’application automatiquement à chaque commit.',
    examples: [
      {
        en: 'The build broke in the CI/CD pipeline because a unit test failed.',
        fr: 'Le build a échoué dans le pipeline CI/CD car un test unitaire ne passait pas.'
      },
      {
        en: 'We run security linting directly inside our GitLab CI pipeline.',
        fr: 'Nous exécutons l’analyse de sécurité statique directement dans notre pipeline CI.'
      }
    ],
    takeaway: 'CI/CD = Moins de travail manuel, zéros surprises le vendredi soir.',
    quiz: {
      question: "Que signifie le sigle 'CI' dans CI/CD ?",
      options: [
        "Continuous Integration",
        "Code Inspection",
        "Cloud Infrastructure",
        "Core Interface"
      ],
      correctIndex: 0,
      explanation: "CI signifie Continuous Integration (Intégration Continue) : fusionner et tester le code fréquemment."
    }
  },
  {
    id: 'kubernetes',
    term: 'Kubernetes',
    phonetic: '/ˌkjuːbərˈnetiːz/',
    category: 'Cloud',
    partOfSpeech: 'noun',
    enDef: 'An open-source container orchestration platform for automating deployment, scaling, and management of containerized applications.',
    frDef: 'Plateforme open source qui gère, déploie et met à l’échelle automatiquement des conteneurs (Docker) sur des clusters de serveurs.',
    examples: [
      {
        en: 'Kubernetes automatically scales our pods when traffic spikes.',
        fr: 'Kubernetes adapte automatiquement le nombre de pods lors des pics de trafic.'
      },
      {
        en: 'We deployed our microservices cluster using managed Kubernetes (EKS).',
        fr: 'Nous avons déployé notre cluster de microservices sur Kubernetes managé (EKS).'
      }
    ],
    takeaway: 'Kubernetes (K8s) = Le chef d’orchestre des conteneurs.',
    quiz: {
      question: "Quelle est l'abréviation standard couramment utilisée pour Kubernetes ?",
      options: [
        "K8s (8 lettres entre K et S)",
        "KubeNet",
        "KN9",
        "K-Cloud"
      ],
      correctIndex: 0,
      explanation: "K8s est un numéronyme : il y a 8 lettres entre la lettre initiale 'K' et finale 's' dans 'Kubernetes'."
    }
  },
  {
    id: 'asynchronous',
    term: 'Asynchronous',
    phonetic: '/eɪˈsɪŋkrənəs/',
    category: 'Frontend',
    partOfSpeech: 'adjective',
    enDef: 'A process that runs independently of the main execution thread, allowing other operations to continue without blocking.',
    frDef: 'Qualifie un traitement non bloquant s’exécutant en arrière-plan sans geler l’interface utilisateur ou le thread principal.',
    examples: [
      {
        en: 'We use async/await syntax to handle asynchronous HTTP requests cleanly.',
        fr: 'Nous utilisons la syntaxe async/await pour gérer proprement les requêtes HTTP asynchrones.'
      },
      {
        en: 'Asynchronous event queues prevent our server from stalling under heavy load.',
        fr: 'Les files d’attente asynchrones empêchent notre serveur de bloquer sous forte charge.'
      }
    ],
    takeaway: 'Async = Ne jamais faire attendre l’utilisateur pendant un calcul lourd.',
    quiz: {
      question: "En JavaScript, quel mot-clé permet d'attendre la résolution d'une Promise sans bloquer le thread ?",
      options: [
        "await",
        "defer",
        "halt",
        "sleep"
      ],
      correctIndex: 0,
      explanation: "'await' s'utilise dans une fonction déclarée 'async' pour suspendre l'exécution locale jusqu'à la résolution d'une Promise."
    }
  },
  {
    id: 'latency',
    term: 'Latency',
    phonetic: '/ˈleɪtənsi/',
    category: 'Backend',
    partOfSpeech: 'noun',
    enDef: 'The time delay between a user action (or request) and the corresponding server response.',
    frDef: 'Le délai de transmission nécessaire pour qu’un paquet réseau aille d’un émetteur à un récepteur (temps de réponse).',
    examples: [
      {
        en: 'Moving our database closer to the application layer reduced network latency to 8ms.',
        fr: 'Rapprocher notre base de données de l’application a réduit la latence réseau à 8 ms.'
      },
      {
        en: 'Low latency is critical for real-time financial trading applications.',
        fr: 'Une faible latence est essentielle pour les applications de trading en temps réel.'
      }
    ],
    takeaway: 'Faible latence = Expérience instantanée et fluide pour l’utilisateur.',
    quiz: {
      question: "La latence est généralement mesurée en quelle unité pour les API web ?",
      options: [
        "Millisecondes (ms)",
        "Gigaoctets (Go)",
        "Hertz (Hz)",
        "Requêtes par heure"
      ],
      correctIndex: 0,
      explanation: "La latence réseau se mesure en millisecondes (ms). Un bon temps de réponse serveur est généralement < 100ms."
    }
  },
  {
    id: 'cache',
    term: 'Cache Invalidation',
    phonetic: '/kæʃ ɪnˌvælɪˈdeɪʃn/',
    category: 'Architecture',
    partOfSpeech: 'noun',
    enDef: 'The process of removing or updating stale data from temporary memory so the client sees the most current information.',
    frDef: 'Action de purger ou actualiser les données devenues obsolètes dans la mémoire cache.',
    examples: [
      {
        en: 'There are only two hard things in Computer Science: cache invalidation and naming things.',
        fr: 'Il n’y a que deux choses difficiles en informatique : l’invalidation de cache et le nommage des choses.'
      },
      {
        en: 'We use Redis cache keys with short TTLs to simplify cache invalidation.',
        fr: 'Nous utilisons des clés de cache Redis avec des TTL courts pour simplifier l’invalidation.'
      }
    ],
    takeaway: 'Cache = Données ultra-rapides, mais attention aux données périmées.',
    quiz: {
      question: "Que signifie l'acronyme TTL souvent associé à un cache ?",
      options: [
        "Time To Live (durée de validité)",
        "Total Transfer Latency",
        "Terminal Track Logic",
        "Technical Testing Limit"
      ],
      correctIndex: 0,
      explanation: "TTL (Time To Live) indique la durée maximale en secondes pendant laquelle une donnée reste valide dans le cache."
    }
  },
  {
    id: 'webhook',
    term: 'Webhook',
    phonetic: '/ˈwebhʊk/',
    category: 'Backend',
    partOfSpeech: 'noun',
    enDef: 'A mechanism that allows one application to send automated real-time data to another application via an HTTP POST request upon an event.',
    frDef: 'Un rappel automatique (reverse API) où un service vous notifie d’un événement en envoyant un POST vers votre URL dès qu’il se produit.',
    examples: [
      {
        en: 'Stripe sends a webhook to our server as soon as a customer subscription succeeds.',
        fr: 'Stripe envoie un webhook à notre serveur dès que l’abonnement d’un client est confirmé.'
      },
      {
        en: 'Always verify the webhook signature before processing incoming payloads.',
        fr: 'Vérifiez toujours la signature cryptographique du webhook avant de traiter les données reçues.'
      }
    ],
    takeaway: 'Webhook = "Ne me relancez pas (polling), c’est moi qui vous appelle dès que c’est prêt".',
    quiz: {
      question: "Pourquoi préfère-t-on les webhooks au polling régulier ?",
      options: [
        "Ils sont instantanés et évitent des millions de requêtes inutiles",
        "Ils ne nécessitent pas de connexion Internet",
        "Ils remplacent complètement les bases de données",
        "Ils augmentent la latence pour plus de sécurité"
      ],
      correctIndex: 0,
      explanation: "Un webhook envoie l'information en temps réel uniquement lors d'un événement, évitant au client d'interroger le serveur toutes les secondes."
    }
  },
  {
    id: 'refactor',
    term: 'Refactor',
    phonetic: '/ˌriːˈfæktər/',
    category: 'Frontend',
    partOfSpeech: 'verb',
    enDef: 'To restructure existing computer code without changing its external behavior or functionality, to improve readability and maintainability.',
    frDef: 'Réorganiser et assainir du code existant sans en modifier le comportement fonctionnel, pour le rendre plus lisible, propre et maintenable.',
    examples: [
      {
        en: 'We need to refactor this monolithic component into smaller, reusable hooks.',
        fr: 'Nous devons refactoriser ce composant monolithique en plusieurs hooks réutilisables.'
      },
      {
        en: 'Make sure our test suite passes before and after you refactor.',
        fr: 'Assurez-vous que tous les tests passent avant et après votre refactorisation.'
      }
    ],
    takeaway: 'Refactorer = Rendre le code plus élégant sans rien casser pour l’utilisateur.',
    quiz: {
      question: "Quel est le but premier d'un 'refactoring' de code ?",
      options: [
        "Améliorer la lisibilité et la maintenabilité sans changer le résultat fonctionnel",
        "Ajouter 5 nouvelles fonctionnalités au produit",
        "Changer la couleur de l'interface graphique",
        "Réécrire le programme dans un langage totalement différent"
      ],
      correctIndex: 0,
      explanation: "Le refactoring vise la qualité interne du code : structure plus claire, moins de duplication, sans changer ce que fait le programme."
    }
  },
  {
    id: 'sharding',
    term: 'Database Sharding',
    phonetic: '/ˈʃɑːrdɪŋ/',
    category: 'Data & AI',
    partOfSpeech: 'noun',
    enDef: 'A horizontal database partitioning technique that splits a large dataset across multiple database instances to distribute workload.',
    frDef: 'Technique de découpage horizontal d’une vaste base de données sur plusieurs serveurs pour répartir la charge et le stockage.',
    examples: [
      {
        en: 'We used sharding based on user geographic region to scale our user database.',
        fr: 'Nous avons utilisé le sharding par zone géographique pour faire évoluer notre base d’utilisateurs.'
      },
      {
        en: 'Sharding significantly improves write throughput for high-traffic apps.',
        fr: 'Le sharding améliore considérablement le débit en écriture pour les applications à fort trafic.'
      }
    ],
    takeaway: 'Sharding = Diviser une base géante en plusieurs morceaux sur des machines différentes.',
    quiz: {
      question: "Quelle est la différence clé entre la réplication et le sharding ?",
      options: [
        "La réplication copie les mêmes données ; le sharding divise les données en sous-ensembles",
        "Le sharding ne fonctionne que sur les fichiers texte",
        "La réplication supprime les données après lecture",
        "Le sharding est une technique exclusive au frontend"
      ],
      correctIndex: 0,
      explanation: "La réplication duplique les mêmes données pour la haute disponibilité en lecture ; le sharding découpe la base pour distribuer le volume."
    }
  },
  {
    id: 'deprecate',
    term: 'Deprecate',
    phonetic: '/ˈdeprəkeɪt/',
    category: 'Architecture',
    partOfSpeech: 'verb',
    enDef: 'To declare an API endpoint, library, or software feature obsolete and recommend against its future use before eventual removal.',
    frDef: 'Déclarer obsolète une fonctionnalité ou une route d’API, en avertissant les développeurs qu’elle sera supprimée dans une future version.',
    examples: [
      {
        en: 'Version 1 of the REST API will be deprecated starting next month.',
        fr: 'La version 1 de l’API REST sera dépréciée à partir du mois prochain.'
      },
      {
        en: 'The compiler threw a warning because we used a deprecated method.',
        fr: 'Le compilateur a généré un avertissement car nous utilisions une méthode dépréciée.'
      }
    ],
    takeaway: 'Deprecate = "Ça marche encore aujourd’hui, mais préparez-vous à migrer".',
    quiz: {
      question: "Quand une fonction est marquée 'deprecated', que doit faire un développeur ?",
      options: [
        "Migrer vers la nouvelle méthode recommandée dès que possible",
        "Ignorer l'avertissement car le code compile toujours",
        "Effacer immédiatement tout le projet",
        "Contacter le support client"
      ],
      correctIndex: 0,
      explanation: "Un marquage 'deprecated' signale que la fonctionnalité fonctionne encore temporairement mais disparaîtra bientôt."
    }
  },
  {
    id: 'payload',
    term: 'Payload',
    phonetic: '/ˈpeɪloʊd/',
    category: 'Backend',
    partOfSpeech: 'noun',
    enDef: 'The essential data carried inside a message, HTTP request, or packet, excluding headers and metadata.',
    frDef: 'La charge utile : les données métiers effectives contenues dans une requête ou une réponse (ex: le corps JSON), hors en-têtes.',
    examples: [
      {
        en: 'The JSON payload in the POST request contains the user’s email and encrypted password.',
        fr: 'La charge utile JSON de la requête POST contient l’email et le mot de passe chiffré de l’utilisateur.'
      },
      {
        en: 'We compressed the payload to save bandwidth on mobile networks.',
        fr: 'Nous avons compressé la charge utile pour économiser la bande passante sur mobile.'
      }
    ],
    takeaway: 'Payload = Le colis transporté dans le camion (le camion étant les en-têtes HTTP).',
    quiz: {
      question: "Dans une requête HTTP `POST /api/users` avec un corps `{ \"name\": \"Alex\" }`, quel est le payload ?",
      options: [
        "L'objet JSON `{ \"name\": \"Alex\" }`",
        "L'URL `/api/users`",
        "L'en-tête `Content-Type: application/json`",
        "Le code de statut `200 OK`"
      ],
      correctIndex: 0,
      explanation: "Le payload est le corps même du message transmis, excluant les en-têtes ou la méthode HTTP."
    }
  }
];

// 15 Key action verbs for Tech Career & Interview guide
const INTERVIEW_VERBS = [
  { verb: 'Streamline', meaning: 'Optimiser / Simplifier un processus', example: 'I streamlined the deployment cycle from 2 hours to 10 minutes.' },
  { verb: 'Architect', meaning: 'Concevoir l’architecture globale', example: 'I architected a fault-tolerant microservices solution on AWS.' },
  { verb: 'Refactor', meaning: 'Restructurer et assainir du code', example: 'I refactored legacy components into modern React functional components.' },
  { verb: 'Deploy', meaning: 'Mettre en production / Déployer', example: 'We deployed zero-downtime updates using rolling deployments.' },
  { verb: 'Mitigate', meaning: 'Atténuer / Réduire un risque ou incident', example: 'We mitigated DDoS risks by integrating Cloudflare Web Application Firewall.' },
  { verb: 'Spearhead', meaning: 'Piloter / Être le fer de lance d’une initiative', example: 'I spearheaded the migration from REST to GraphQL across 3 squads.' },
  { verb: 'Containerize', meaning: 'Conteneuriser une application', example: 'I containerized backend services using Docker and Helm charts.' },
  { verb: 'Benchmark', meaning: 'Mesurer et comparer des performances', example: 'We benchmarked Redis against Memcached for our session store.' },
  { verb: 'Automate', meaning: 'Automatiser une tâche répétitive', example: 'I automated regression testing using Cypress in the CI pipeline.' },
  { verb: 'Decouple', meaning: 'Découpler des composants dépendants', example: 'We decoupled the billing service using asynchronous Kafka queues.' }
];
