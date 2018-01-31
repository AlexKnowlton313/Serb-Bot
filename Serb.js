// Import discord.js module
const Discord = require('discord.js');

// Create instance of Discord client
const client = new Discord.Client();

// Make sure our bot is ready, commands will not execute until Serb is ready
client.on('ready', () => {
	console.log("Let's drink comrades!");
});

// Simple listener for messages
client.on('message', message => {
	console.log("got a message comrades!");
	if (message.content === 'ping') {
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
client.login("NDA4Mzg0NjgxMDA0NzYxMTA4.DVPclQ.pfuIKtAgGfeauxIkouurffv7v00");