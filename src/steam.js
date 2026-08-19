const EventEmitter = require('events');

const LOBBY_TYPE_FRIENDS_ONLY = 1;
const SEND_UNRELIABLE = 0;
const SEND_RELIABLE = 2;
const CALLBACK_LOBBY_CHAT_UPDATE = 5;
const CALLBACK_P2P_SESSION_REQUEST = 6;
const CALLBACK_GAME_LOBBY_JOIN_REQUESTED = 8;

class SteamService extends EventEmitter {
  constructor() {
    super();
    this.enabled = false;
    this.client = null;
    this.steamworks = null;
    this.lobby = null;
    this.lobbyId = null;
    this.members = [];
    this.localId = 'local';
    this.localName = 'Local Player';
    this.onMessage = null;
    this.pollTimer = null;
    this.callbackTimer = null;
    this.callbackHandles = [];
  }

  async init() {
    try {
      const appId = Number(process.env.RAID_QIX_STEAM_APP_ID || 480);
      this.steamworks = require('steamworks.js');
      this.client = this.steamworks.init(appId);
      const local = this.client.localplayer.getSteamId();
      this.localId = String(local.steamId64);
      this.localName = this.client.localplayer.getName();
      this.enabled = true;
      this.installSteamCallbacks();
      this.startP2PPoll();
      this.startCallbackPump();
    } catch (error) {
      console.warn('[Steam] Offline fallback:', error.message);
      this.enabled = false;
    }
    return this.getState();
  }

  getState() {
    return {
      enabled: this.enabled,
      lobbyId: this.lobbyId,
      localId: this.localId,
      localName: this.localName,
      members: this.members
    };
  }

  async createLobby(options = {}) {
    if (!this.enabled) {
      this.lobbyId = 'LOCAL-HOST';
      this.members = [{ id: this.localId, name: this.localName, host: true }];
      return this.getState();
    }

    const maxMembers = Math.max(2, Math.min(16, Number(options.maxMembers) || 4));
    this.lobby = await this.client.matchmaking.createLobby(LOBBY_TYPE_FRIENDS_ONLY, maxMembers);
    this.lobbyId = String(this.lobby.id);
    this.lobby.setData('game', 'raid-qix');
    this.lobby.setData('protocol', '1');
    await this.refreshMembers();
    return this.getState();
  }

  async joinLobby(lobbyId) {
    if (!this.enabled) {
      this.lobbyId = String(lobbyId || 'LOCAL-JOIN');
      this.members = [{ id: this.localId, name: this.localName, host: false }];
      return this.getState();
    }

    const id = BigInt(String(lobbyId).trim());
    this.lobby = await this.client.matchmaking.joinLobby(id);
    this.lobbyId = String(this.lobby.id);
    await this.refreshMembers();
    return this.getState();
  }

  openInviteDialog() {
    if (!this.enabled || !this.lobby) return false;
    try {
      if (typeof this.lobby.openInviteDialog === 'function') {
        this.lobby.openInviteDialog();
        return true;
      }
      if (this.client?.overlay?.activateInviteDialog) {
        this.client.overlay.activateInviteDialog(this.lobby.id);
        return true;
      }
    } catch (error) {
      console.warn('[Steam] Invite dialog failed:', error.message);
    }
    return false;
  }

  async leaveLobby() {
    if (this.enabled && this.lobby) this.lobby.leave();
    this.lobby = null;
    this.lobbyId = null;
    this.members = [];
    return this.getState();
  }

  async refreshMembers() {
    if (!this.enabled || !this.lobby) return this.members;

    const ownerId = String(this.lobby.getOwner().steamId64);
    const raw = this.lobby.getMembers();
    this.members = raw.map((member, index) => {
      const id = String(member.steamId64);
      return {
        id,
        name: id === this.localId ? this.localName : `Steam ${id.slice(-6)}`,
        host: id === ownerId,
        index
      };
    });
    this.emitLobbyState();
    return this.members;
  }

  getMembers() {
    return this.refreshMembers();
  }

  installSteamCallbacks() {
    if (!this.enabled || !this.client?.callback) return;

    this.callbackHandles.push(
      this.client.callback.register(CALLBACK_P2P_SESSION_REQUEST, event => {
        try {
          this.client.networking.acceptP2PSession(event.remote);
        } catch (error) {
          console.warn('[Steam] Failed to accept P2P session:', error.message);
        }
      })
    );

    this.callbackHandles.push(
      this.client.callback.register(CALLBACK_LOBBY_CHAT_UPDATE, event => {
        if (!this.lobbyId || String(event.lobby) !== this.lobbyId) return;
        this.refreshMembers().catch(console.warn);
      })
    );

    this.callbackHandles.push(
      this.client.callback.register(CALLBACK_GAME_LOBBY_JOIN_REQUESTED, event => {
        this.joinLobby(String(event.lobby_steam_id)).catch(error => {
          console.warn('[Steam] Invite join failed:', error.message);
        });
      })
    );
  }

  startCallbackPump() {
    if (!this.enabled || !this.steamworks?.runCallbacks || this.callbackTimer) return;
    this.callbackTimer = setInterval(() => {
      try { this.steamworks.runCallbacks(); }
      catch (error) { console.warn('[Steam] Callback pump:', error.message); }
    }, 16);
  }

  startP2PPoll() {
    if (!this.enabled || this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      try {
        let size = this.client.networking.isP2PPacketAvailable();
        let guard = 0;
        while (size > 0 && guard++ < 128) {
          const packet = this.client.networking.readP2PPacket(size);
          const envelope = JSON.parse(packet.data.toString('utf8'));
          const senderId = String(packet.steamId.steamId64);
          this.onMessage?.({ ...envelope.payload, senderId, sentAt: envelope.sentAt });
          size = this.client.networking.isP2PPacketAvailable();
        }
      } catch (error) {
        console.warn('[Steam] P2P poll:', error.message);
      }
    }, 16);
  }

  emitLobbyState() {
    this.onMessage?.({ type: 'lobby-state', ...this.getState(), senderId: 'steam' });
  }

  async send(payload) {
    const reliableTypes = new Set([
      'raid-start', 'boss-damage', 'capture-state', 'grid-state', 'raid-clear', 'player-dead', 'session-start', 'random-start', 'random-floor', 'bgm-sync'
    ]);
    const envelope = Buffer.from(JSON.stringify({ payload, sentAt: Date.now() }), 'utf8');

    if (!this.enabled) {
      this.onMessage?.({ ...payload, senderId: this.localId, sentAt: Date.now() });
      return true;
    }
    if (!this.lobby) return false;

    const sendType = reliableTypes.has(payload.type) ? SEND_RELIABLE : SEND_UNRELIABLE;
    let success = true;
    for (const member of this.lobby.getMembers()) {
      const peerId = member.steamId64;
      if (String(peerId) === this.localId) continue;
      success = this.client.networking.sendP2PPacket(peerId, sendType, envelope) && success;
    }
    return success;
  }

  dispose() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.callbackTimer) clearInterval(this.callbackTimer);
    for (const handle of this.callbackHandles) {
      try { handle.disconnect(); } catch {}
    }
    this.callbackHandles = [];
    this.pollTimer = null;
    this.callbackTimer = null;
  }
}

module.exports = SteamService;
