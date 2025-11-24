const pendingBattles = require('../services/pendingBattles');
const poketwo = require('../services/poketwo');

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

module.exports = {
    name: 'battle',
    description: 'Challenge another trainer to a Pokétwo Showdown battle.',
    async execute(message, args){
        const opponent = message.mentions.users.first();
        if(!opponent){
            return message.channel.send('You need to mention who you want to battle.');
        }
        if(opponent.id === message.author.id){
            return message.channel.send('You cannot battle yourself.');
        }
        const teamArgs = args.slice(1);
        const team = parseTeam(teamArgs);
        if(team.length === 0){
            return message.channel.send('Please provide at least one Pokémon for your team (comma separated).');
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
        pendingBattles.createChallenge({
            challengerId: message.author.id,
            opponentId: opponent.id,
            challengerTeam: team,
            channelId: message.channel.id
        });
        console.info(`[battles] ${message.author.tag} challenged ${opponent.tag} with ${team.join(', ')}`);
        const instructions = [
            `${opponent}, you have been challenged to a battle by ${message.author}!`,
            'Use `-acceptbattle @challenger your,team,list` to accept within 10 minutes.'
        ];
        return message.channel.send(instructions.join('\n'));
    }
};
