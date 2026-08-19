const EventEmitter = require('events');

class SteamService extends EventEmitter {
  constructor() {
    super();
    this.enabled = false;
    this.client = null;
    this.lobbyId = null;
    this.onMessage = null;
    this.members = [];
  }

  async init() {
    try {
      // Spacewar (480) is used for local development only.
      // Replace with the real Steam App ID before shipping.
      const steamworks = require('steamworks.js');
      this.client = steamworks.init(480);
      this.enabled = true;
    } catch (error) {
      console.warn('[Steam] Offline fallback:', error.message);
      this.enabled = false;
    }
  }

  getState() {
    return {
      enabled: this.enabled,
      lobbyId: this.lobbyId,
      members: this.members
    };
  }

  async createLobby(options = {}) {
    if (!this.enabled) {
      this.lobbyId = 'LOCAL-HOST';
      this.members = [{ id: 'local', name: 'Local Player', host: true }];
      return this.getState();
    }

    // steamworks.js matchmaking APIs vary slightly between releases.
    // This adapter deliberately isolates that surface so game code never depends on it.
    if (!this.client.matchmaking || !this.client.matchmaking.createLobby) {
      throw new Error('Steam matchmaking API unavailable in this steamworks.js build.');
    }

    const maxMembers = options.maxMembers || 4;
    const lobby = await this.client.matchmaking.createLobby('friendsOnly', maxMembers);
    this.lobbyId = String(lobby.id ?? lobby);
    await this.refreshMembers();
    this.installSteamCallbacks();
    return this.getState();
  }

  async joinLobby(lobbyId) {
    if (!this.enabled) {
      this.lobbyId = String(lobbyId || 'LOCAL-JOIN');
      this.members = [{ id: 'local', name: 'Local Player', host: false }];
      return this.getState();
    }

    if (!this.client.matchmaking || !this.client.matchmaking.joinLobby) {
      throw new Error('Steam matchmaking API unavailable in this steamworks.js build.');
    }

    const lobby = await this.client.matchmaking.joinLobby(lobbyId);
    this.lobbyId = String(lobby.id ?? lobbyId);
    await this.refreshMembers();
    this.installSteamCallbacks();
    return this.getState();
  }

  async leaveLobby() {
    try {
      if (this.enabled && this.lobbyId && this.client.matchmaking?.leaveLobby) {
        await this.client.matchmaking.leaveLobby(this.lobbyId);
      }
    } finally {
      this.lobbyId = null;
      this.members = [];
    }
    return this.getState();
  }

  async refreshMembers() {
    if (!this.enabled || !this.lobbyId) return this.members;
    if (this.client.matchmaking?.getLobbyMembers) {
      const raw = await this.client.matchmaking.getLobbyMembers(this.lobbyId);
      this.members = (raw || []).map((member, index) => ({
        id: String(member.steamId ?? member.id ?? index),
        name: member.name ?? `Player ${index + 1}`,
        host: Boolean(member.owner ?? index === 0)
      }));
    }
    return this.members;
  }

  getMembers() {
    return this.refreshMembers();
  }

  installSteamCallbacks() {
    // Keep callback registration in this adapter. Actual transport can be swapped
    // to Steam Networking Messages/Sockets without touching renderer gameplay.
  }

  async send(payload) {
    const packet = { ...payload, sentAt: Date.now() };

    if (!this.enabled) {
      this.onMessage?.(packet);
      return true;
    }

    // Transport hook. Intended for Steam Networking Messages / P2P.
    // Until the final steamworks.js API version is locked, loop back locally so
    // the game protocol and lobby UI can be exercised safely.
    this.onMessage?.(packet);
    return true;
  }
}

module.exports = SteamService;
