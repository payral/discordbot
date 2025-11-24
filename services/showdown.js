const crypto = require('crypto');

function buildImportableTeam(pokemonList){
    return pokemonList
        .map(name => `${name}\nAbility: Unknown\nLevel: 50\n- Tackle`)
        .join('\n\n');
}

function generateRoomId(){
    return `gen9custom-${crypto.randomBytes(5).toString('hex')}`;
}

function createBattleRoom({ challengerTag, opponentTag }){
    const roomId = generateRoomId();
    const baseUrl = 'https://play.pokemonshowdown.com/';
    const spectator = `${baseUrl}battle-${roomId}`;
    const challengerLink = `${spectator}?p1=${encodeURIComponent(challengerTag)}`;
    const opponentLink = `${spectator}?p2=${encodeURIComponent(opponentTag)}`;
    return {
        roomId,
        links: {
            spectator,
            challenger: challengerLink,
            opponent: opponentLink
        }
    };
}

module.exports = {
    buildImportableTeam,
    createBattleRoom
};
