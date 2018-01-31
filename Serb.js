// Import discord.js module
const Discord = require('discord.js');

// Create instance of Discord client
const client = new Discord.Client();

// Import config file
const config = require("./config.json");

// Make sure our bot is ready, commands will not execute until Serb is ready
client.on('ready', () => {
	console.log("Let's drink comrades!");
});

// Listener for messages
client.on('message', message => {
	// if our message doesn't start with '!' then do nothing
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	console.log("got a message comrades!");
	if (message.content.startsWith(prefix + 'ping')) {
		message.channel.send('pong');
	}
});

// When a new member joins, add them to the 'proletarian' role
client.on('guildMemeberAdd', member => {
	console.log("new person!");

	// find our ProlRole
	const proletarianRole = member.guild.roles.find("name", "Proletarians");

	// if it doesn't exist for some reason then we exit
	if (!proletarianRole) return;

	// set the role
	member.addRole(proletarianRole).catch(console.error);
})

// Log the bot in using our token: https://discordapp.com/developers/applications/me/408384681004761108
client.login(config.token);