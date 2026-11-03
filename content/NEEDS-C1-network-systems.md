# Besoins en termes C1 pour le rôle : network-systems

Le rôle `network-systems` ne dispose actuellement que de 3 termes de niveau C1 :
- `hypervisor`
- `raid`
- `jitter`

Pour construire au moins 2 unités à dominante C1 (minimum 3 leçons par unité avec 3 termes par leçon, soit 9 à 18 termes C1 nécessaires), voici une liste de 12 termes techniques C1 recommandés pour enrichir `content/roles/network-systems.json` :

1. `bgp` (Border Gateway Protocol) : Protocole de routage dynamique à vecteur de chemin gérant l'échange de routes entre systèmes autonomes sur Internet.
2. `mpls` (Multi-Protocol Label Switching) : Technique d'acheminement de trafic utilisant des étiquettes (labels) pour optimiser le routage et garantir la QoS.
3. `zero-trust-network-access` (ZTNA) : Modèle de sécurité réseau accordant un accès granulaire et vérifié en continu selon le principe du moindre privilège.
4. `sd-wan` (Software-Defined Wide Area Network) : Architecture réseau utilisant le logiciel pour gérer dynamiquement les connexions WAN multi-liens.
5. `load-balancer-clustering` : Regroupement de répartiteurs de charge en haute disponibilité avec basculement automatique et synchronisation d'état.
6. `mtu-fragmentation` (fragmentation MTU) : Découpage des paquets IP lorsque leur taille dépasse l'Unité Maximale de Transmission du lien physique.
7. `spantree-protocol` (Spanning Tree Protocol / STP) : Protocole de niveau 2 évitant les boucles de commutation dans un réseau Ethernet redondé.
8. `disaster-recovery-orchestration` : Automatisation des procédures de reprise après sinistre, failover inter-sites et synchronisation de stockage distant.
9. `bare-metal-provisioning` : Déploiement automatisé d'un système d'exploitation directement sur du matériel physique sans couche de virtualisation préalable.
10. `snmp-trap` : Alerte asynchrone envoyée par un équipement réseau supervisé à un gestionnaire central pour signaler un incident immédiat.
11. `qos-traffic-shaping` : Mise en forme et lissage du débit réseau pour prioriser les flux critiques (voix, vidéo) par rapport aux flux non prioritaires.
12. `multicast-routing` : Acheminement efficace de paquets réseau destinés à un groupe sélectionné de destinataires simultanés (ex. PIM, IGMP).

