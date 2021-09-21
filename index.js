const Discord = require('discord.js');
//const { Client, Intents, DiscordAPIError } = require('discord.js');

const client = new Discord.Client({partials: ["MESSAGE", "CHANNEL", "REACTION"]});

//const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// const fs = require('fs');

client.commands = new Discord.Collection();
client.events = new Discord.Collection();

['command_handler','event_handler'].forEach(handler =>{
    require(`./handlers/${handler}`)(client,Discord);
})

// const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

/* for(const file of commandFiles){
    const command = require(`./commands/${file}`);
 
    client.commands.set(command.name, command);
}
 */
/* client.once('ready', () => {
    console.log("Bang bang is online.");
})


client.on('message', message =>{
    if(!message.content.startsWith(prefix) || message.author.bot) return;
 
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
 
    if(command === 'ping'){
        client.commands.get('ping').execute(message, args);
    } 
    if(command === 'play'){
        client.commands.get('play').execute(message, args, command, client, Discord);
    } 
});

 */

client.login(process.env.DJS_TOKEN);