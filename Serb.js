const { WorldOfTanks } = require('wargamer');
const Discord = require('discord.js');
const config = require("./config.json");

// Import discord.js module

// Create instance of Discord client
const client = new Discord.Client();
// Create instance of wot
const wot = new WorldOfTanks({realm: 'na', applicationId: config.WotID});

// Make sure our bot is ready, commands will not execute until Serb is ready
client.on('ready', () => {
	console.log("Let's drink comrades!");
});

// Listener for messages
client.on('message', message => {
	// if our message doesn't start with '!' then do nothing
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	// separate our message into command and args
	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	// Check stats command. return if there are no args
	if (command === 'stats') {
		if (args.length === 0) {
			message.channel.send("The `!stats` command must be followed by a username");
		} else {
			// get the account id by username
			wot.get('account/list', { search: args[0] }).then((response) => {
				// get the account stats by username
				wot.get('account/info', { account_id: response.data[0].account_id }).then((response) => {
					console.log(response.data);
				}).catch((error) => {
					console.log(error.message);
					message.reply(`I was unable to find WoT data for ${args[0]}`);
					return;
				});
			}).catch((error) => {
				console.log(error.message);
				message.reply(`I was unable to find WoT data for ${args[0]}`);
				return;
			});

			message.channel.send(args[0]);
		}
	}

	// simple kick command
	if (command === 'kick') {
		// only users with the kick members permission may kick members
		if (message.guild.me.hasPermission("KICK_MEMBERS")) {
			let kickMember = message.mentions.members.first();

			// if no member is mentioned
			if (!kickMember) {
				message.reply('mention a user to kick them.');
				return;
			}

			let reason = args.slice(1).join(" ");
			kickMember.kick(reason).then(kickedMember => {
				message.reply(`${kickedMember.user.username} was kicked.`);
			});
		}
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