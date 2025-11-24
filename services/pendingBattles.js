const DEFAULT_TTL_MS = 10 * 60 * 1000;

class PendingBattles {
    constructor(logger = console){
        this.logger = logger;
        this.challenges = new Map();
    }

    makeKey(challengerId, opponentId){
        return `${challengerId}:${opponentId}`;
    }

    createChallenge({ challengerId, opponentId, challengerTeam, channelId, ttl = DEFAULT_TTL_MS }){
        const key = this.makeKey(challengerId, opponentId);
        this.cancelChallenge(key, 'overwritten');
        const expiresAt = Date.now() + ttl;
        const timeout = setTimeout(() => {
            this.logger.warn(`[battles] Expiring challenge ${key}`);
            this.challenges.delete(key);
        }, ttl);
        const challenge = {
            challengerId,
            opponentId,
            challengerTeam,
            channelId,
            createdAt: Date.now(),
            expiresAt,
            timeout,
            status: 'awaiting-opponent'
        };
        this.challenges.set(key, challenge);
        this.logger.info(`[battles] Stored challenge ${key} until ${new Date(expiresAt).toISOString()}`);
        return challenge;
    }

    getChallenge(challengerId, opponentId){
        return this.challenges.get(this.makeKey(challengerId, opponentId));
    }

    findByOpponent(opponentId){
        for(const [key, value] of this.challenges.entries()){
            if(value.opponentId === opponentId){
                return { key, value };
            }
        }
        return null;
    }

    completeChallenge(challengerId, opponentId, opponentTeam){
        const key = this.makeKey(challengerId, opponentId);
        const record = this.challenges.get(key);
        if(!record){
            return null;
        }
        clearTimeout(record.timeout);
        this.challenges.delete(key);
        const resolved = {
            challengerId,
            opponentId,
            challengerTeam: record.challengerTeam,
            opponentTeam,
            channelId: record.channelId,
            createdAt: record.createdAt
        };
        this.logger.info(`[battles] Challenge ${key} marked as completed`);
        return resolved;
    }

    cancelChallenge(key, reason){
        const record = this.challenges.get(key);
        if(record){
            clearTimeout(record.timeout);
            this.logger.warn(`[battles] Challenge ${key} cancelled (${reason})`);
            this.challenges.delete(key);
        }
    }
}

module.exports = new PendingBattles();
module.exports.PendingBattles = PendingBattles;
