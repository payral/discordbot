class PoketwoService {
    constructor(logger = console){
        this.logger = logger;
        this.cachedRoster = null;
    }

    loadRoster(){
        if(this.cachedRoster !== null){
            return this.cachedRoster;
        }
        const raw = process.env.POKETWO_DATA;
        if(!raw){
            this.logger.warn('[poketwo] POKETWO_DATA missing; unable to verify ownership');
            this.cachedRoster = {};
            return this.cachedRoster;
        }
        try {
            const parsed = JSON.parse(raw);
            this.cachedRoster = parsed;
        } catch (error){
            this.logger.error(`[poketwo] Failed to parse POKETWO_DATA: ${error.message}`);
            this.cachedRoster = {};
        }
        return this.cachedRoster;
    }

    async getOwnedPokemon(userId){
        const roster = this.loadRoster();
        const owned = roster[userId];
        if(Array.isArray(owned)){
            return owned;
        }
        return [];
    }

    normalizeName(name){
        return name.trim().toLowerCase();
    }

    async validateTeamOwnership(userId, team){
        const owned = await this.getOwnedPokemon(userId);
        const normalizedOwned = owned.map(p => this.normalizeName(p));
        const missing = team.filter(name => !normalizedOwned.includes(this.normalizeName(name)));
        return {
            ok: missing.length === 0,
            missing
        };
    }
}

module.exports = new PoketwoService();
module.exports.PoketwoService = PoketwoService;
