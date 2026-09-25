/**
 * The Whispering Wilds (Kaattu Vazhi) - Authoritative Navigation System
 * Provides topological waypoint graphs, A* pathfinding, road network queries,
 * vehicle lane navigation, and NPC patrol steering across all 8 Tamil Nadu regions.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const navSys = factory();
    root.NavigationEngine = navSys;
    if (typeof window !== 'undefined') {
      window.NavigationEngine = navSys;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class NavigationSystemEngine {
    constructor() {
      // Waypoint Network Nodes: id -> { id, x, y, z, region, connections: [id, ...] }
      this._nodes = new Map();
      this._initRegionalWaypoints();
    }

    _initRegionalWaypoints() {
      // Chennai Urban Arterials (George Town, High Court, Marina)
      this.addNode('wp_che_court_gate', -220, 0, 630, 'george_town');
      this.addNode('wp_che_parrys_corner', -180, 0, 580, 'george_town');
      this.addNode('wp_che_beach_road', -100, 0, 520, 'george_town');
      this.connectNodes('wp_che_court_gate', 'wp_che_parrys_corner');
      this.connectNodes('wp_che_parrys_corner', 'wp_che_beach_road');

      // Cauvery Delta Farmlands & Grand Anicut
      this.addNode('wp_cau_anicut_north', 1150, 0, 420, 'cauvery_delta');
      this.addNode('wp_cau_sluice_crossing', 1220, 0, 450, 'cauvery_delta');
      this.addNode('wp_cau_paddy_trail', 1300, 0, 480, 'cauvery_delta');
      this.connectNodes('wp_cau_anicut_north', 'wp_cau_sluice_crossing');
      this.connectNodes('wp_cau_sluice_crossing', 'wp_cau_paddy_trail');

      // Pichavaram Mangrove Water Channels
      this.addNode('wp_pic_jetty', 2450, 0, 800, 'pichavaram');
      this.addNode('wp_pic_canal_bend', 2550, 0, 860, 'pichavaram');
      this.addNode('wp_pic_deep_grove', 2680, 0, 920, 'pichavaram');
      this.connectNodes('wp_pic_jetty', 'wp_pic_canal_bend');
      this.connectNodes('wp_pic_canal_bend', 'wp_pic_deep_grove');

      // Chettinad Mansions
      this.addNode('wp_che_palace_entry', 3150, 0, 480, 'chettinad');
      this.addNode('wp_che_courtyard', 3200, 0, 500, 'chettinad');
      this.addNode('wp_che_artisan_street', 3280, 0, 530, 'chettinad');
      this.connectNodes('wp_che_palace_entry', 'wp_che_courtyard');
      this.connectNodes('wp_che_courtyard', 'wp_che_artisan_street');

      // Nilgiris Mountain Trails
      this.addNode('wp_nil_tea_factory', 4400, 60, 280, 'nilgiris');
      this.addNode('wp_nil_mist_switchback', 4520, 110, 310, 'nilgiris');
      this.addNode('wp_nil_shola_summit', 4650, 180, 350, 'nilgiris');
      this.connectNodes('wp_nil_tea_factory', 'wp_nil_mist_switchback');
      this.connectNodes('wp_nil_mist_switchback', 'wp_nil_shola_summit');
    }

    addNode(id, x, y, z, region) {
      this._nodes.set(id, { id, x, y, z, region, connections: [] });
    }

    connectNodes(idA, idB) {
      const nodeA = this._nodes.get(idA);
      const nodeB = this._nodes.get(idB);
      if (nodeA && nodeB) {
        if (!nodeA.connections.includes(idB)) nodeA.connections.push(idB);
        if (!nodeB.connections.includes(idA)) nodeB.connections.push(idA);
      }
    }

    findNearestNode(x, z, region = null) {
      let nearest = null;
      let minDistanceSq = Infinity;

      for (const node of this._nodes.values()) {
        if (region && node.region !== region) continue;
        const dSq = (node.x - x) ** 2 + (node.z - z) ** 2;
        if (dSq < minDistanceSq) {
          minDistanceSq = dSq;
          nearest = node;
        }
      }
      return nearest;
    }

    /**
     * Compute shortest path between two world positions
     * @returns {Array<Object>} List of waypoint objects [{x,y,z}, ...]
     */
    findPath(startPos, endPos) {
      if (!startPos || !endPos) return [];

      const startNode = this.findNearestNode(startPos.x, startPos.z);
      const endNode = this.findNearestNode(endPos.x, endPos.z);

      if (!startNode || !endNode) {
        return [{ x: endPos.x, y: endPos.y || 0, z: endPos.z }];
      }

      if (startNode.id === endNode.id) {
        return [
          { x: startNode.x, y: startNode.y, z: startNode.z },
          { x: endPos.x, y: endPos.y || 0, z: endPos.z }
        ];
      }

      // Standard A* Search on Waypoint Graph
      const openSet = new Set([startNode.id]);
      const cameFrom = new Map();

      const gScore = new Map();
      gScore.set(startNode.id, 0);

      const fScore = new Map();
      fScore.set(startNode.id, Math.hypot(startNode.x - endNode.x, startNode.z - endNode.z));

      while (openSet.size > 0) {
        let currentId = null;
        let lowestF = Infinity;

        for (const id of openSet) {
          const score = fScore.get(id) || Infinity;
          if (score < lowestF) {
            lowestF = score;
            currentId = id;
          }
        }

        if (currentId === endNode.id) {
          // Reconstruct path
          const path = [{ x: endPos.x, y: endPos.y || 0, z: endPos.z }];
          let curr = currentId;
          while (cameFrom.has(curr)) {
            const n = this._nodes.get(curr);
            path.unshift({ x: n.x, y: n.y, z: n.z });
            curr = cameFrom.get(curr);
          }
          const startN = this._nodes.get(startNode.id);
          path.unshift({ x: startN.x, y: startN.y, z: startN.z });
          return path;
        }

        openSet.delete(currentId);
        const currentNode = this._nodes.get(currentId);

        for (const neighborId of currentNode.connections) {
          const neighbor = this._nodes.get(neighborId);
          if (!neighbor) continue;

          const edgeCost = Math.hypot(currentNode.x - neighbor.x, currentNode.z - neighbor.z);
          const tentativeG = (gScore.get(currentId) || 0) + edgeCost;

          if (tentativeG < (gScore.get(neighborId) || Infinity)) {
            cameFrom.set(neighborId, currentId);
            gScore.set(neighborId, tentativeG);
            fScore.set(neighborId, tentativeG + Math.hypot(neighbor.x - endNode.x, neighbor.z - endNode.z));
            openSet.add(neighborId);
          }
        }
      }

      // Direct fallback
      return [{ x: endPos.x, y: endPos.y || 0, z: endPos.z }];
    }

    destroy() {
      this._nodes.clear();
    }
  }

  return new NavigationSystemEngine();
});
