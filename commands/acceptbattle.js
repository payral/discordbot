const pendingBattles = require('../services/pendingBattles');
const poketwo = require('../services/poketwo');
const showdown = require('../services/showdown');

function parseTeam(args){
    const raw = args.join(' ').split(',');
    const cleaned = raw
        .map(name => name.trim())
        .filter(name => name.length > 0);
    const seen = new Set();
    const unique = [];
    for(const name of cleaned){
        const lowered = name.toLowerCase();
        if(!seen.has(lowered)){
            seen.add(lowered);
            unique.push(name);
        }
    }
    return unique.slice(0, 6);
}

function findInvalidNames(team){
    const pattern = /^[a-zA-Z][a-zA-Z\s'-]*$/;
    return team.filter(name => !pattern.test(name));
}

async function sendBattleDm(user, joinLink, teamString, opponentTag){
    const body = [
        `Your battle against **${opponentTag}** is ready!`,
        `Join link: ${joinLink}`,
        '',
        'Importable team:',
        '```',
        teamString,
        '```'
    ];
    return user.send(body.join('\n'));
}

module.exports = {
    name: 'acceptbattle',
    description: 'Accept a pending battle challenge and provide your team.',
    async execute(message, args){
        const challenger = message.mentions.users.first();
        let challenge;
        if(challenger){
            challenge = pendingBattles.getChallenge(challenger.id, message.author.id);
        } else {
            const found = pendingBattles.findByOpponent(message.author.id);
            if(found){
                challenge = found.value;
            }
        }
        if(!challenge){
            return message.channel.send('No pending battle found for you. Make sure you were challenged and mention the challenger.');
        }
        const teamArgs = challenger ? args.slice(1) : args;
        const team = parseTeam(teamArgs);
        if(team.length === 0){
            return message.channel.send('Please provide your team (comma separated).');
        }
        if(team.length > 6){
            return message.channel.send('Teams cannot have more than six Pokémon.');
        }
        const invalid = findInvalidNames(team);
        if(invalid.length){
            return message.channel.send(`These Pokémon names look invalid: ${invalid.join(', ')}.`);
        }
        const ownership = await poketwo.validateTeamOwnership(message.author.id, team);
        if(!ownership.ok){
            return message.channel.send(`Ownership verification failed. Missing Pokémon: ${ownership.missing.join(', ') || 'unknown'}`);
        }
        const resolved = pendingBattles.completeChallenge(challenge.challengerId, challenge.opponentId, team);
        if(!resolved){
            return message.channel.send('The battle request expired or was cancelled.');
        }
        const challengerUser = await message.client.users.fetch(resolved.challengerId);
        const opponentUser = await message.client.users.fetch(resolved.opponentId);
        const battleRoom = showdown.createBattleRoom({
            challengerTag: challengerUser.tag,
            opponentTag: opponentUser.tag
        });
        const challengerTeamString = showdown.buildImportableTeam(resolved.challengerTeam);
        const opponentTeamString = showdown.buildImportableTeam(resolved.opponentTeam);

        try {
            await sendBattleDm(challengerUser, battleRoom.links.challenger, challengerTeamString, opponentUser.tag);
            await sendBattleDm(opponentUser, battleRoom.links.opponent, opponentTeamString, challengerUser.tag);
        } catch (error){
            console.error('[battles] Failed to deliver battle links', error);
            return message.channel.send('Battle created, but failed to DM one or both players.');
        }
        console.info(`[battles] Match ready between ${challengerUser.tag} and ${opponentUser.tag} in room ${battleRoom.roomId}`);
        return message.channel.send(`Battle ready! A room has been created: ${battleRoom.links.spectator}`);
    }
};
