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
			message.channel.send(`Fetching stats for ${args[0]}, one moment`);
			// get the account id by username
			wot.get('account/list', { search: args[0] }).then((userList) => {
				const accountID = userList.data[0].account_id;
				// get the account stats by username
				wot.get('account/info', { account_id: accountID }).then((userInfo) => {
					const userStatistics = userInfo.data[Object.keys(userInfo.data)[0]];
					const gameStatistics = userStatistics.statistics.all;
					console.log(gameStatistics);

					// last battle played
					var lastBattleTime = new Date(0); // The 0 there is the key, which sets the date to the epoch
					lastBattleTime.setUTCSeconds(userStatistics.last_battle_time);

					// games played
					const gamesPlayed = gameStatistics.battles;

					// win percentage
					const winPercentage = (gameStatistics.wins / gamesPlayed).toFixed(2);

					// average damage
					const averageDamage = (gameStatistics.damage_dealt / gamesPlayed).toFixed(2);

					// average kills
					const averageKills = (gameStatistics.frags / gamesPlayed).toFixed(2);

					const wotStats = new Discord.RichEmbed()
						.setAuthor(`WoT Statistics for ${args[0]}`, message.author.avatarURL)
						.addField(`Total Games Played`, gamesPlayed, true)
						.addField(`Win Percentage`, winPercentage, true)
						.addField(`Kills Per Game`, averageKills, true)
						.addField(`Damage Per Game`, averageDamage, true)
						.addField(`Last battle`, formatDate(lastBattleTime), true)
						.setColor([219, 16, 41])
						.setFooter("Taken from WargamingAPI")
						.setTimestamp();

						message.channel.send({ embed: wotStats });
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

// date formatter
function formatDate(date) {
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return monthNames[monthIndex] + ' ' + day + ', ' + year;
}

// Log the bot in using our token: https://discordapp.com/developers/applications/me/408384681004761108
client.login(config.token);