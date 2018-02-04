const { WorldOfTanks } = require('wargamer');
const Discord = require('discord.js');
const config = require("./config.json");
const request = require('request');

// Import discord.js module

// Create instance of Discord client
const client = new Discord.Client();
// Create instance of wot
const wot = new WorldOfTanks({realm: 'na', applicationId: config.WotID});

// CURRENT VERSION OF WN8 EXPECTED VALUES
const wn8Version = 30;

// WN8 values in a dictionary
const wn8Values = {};

// Make sure our bot is ready, commands will not execute until Serb is ready
client.on('ready', () => {
	console.log(`Downloading expected tank values version ${wn8Version}`);
	request(`http://www.wnefficiency.net/exp/expected_tank_values_${wn8Version}.json`, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var wn8JSON = JSON.parse(body).data;

			for (var wn8Value of wn8JSON) {
				wn8Values[wn8Value.IDNum] = serializeWn8(wn8Value);
			}

			console.log("Let's drink comrades!");
		} else {
			console.log("Error getting wn8 values");
		}
	});
});

// Listener for messages
client.on('message', message => {
	// if our message doesn't start with '!' then do nothing
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	// separate our message into command and args
	var args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	var command = args.shift().toLowerCase();

	// Check stats command. return if there are no args
	if (command === 'stats') {
		if (args.length === 0) {
			message.channel.send("The `!stats` command must be followed by a username");
		} else {
			message.channel.send(`Fetching stats for ${args[0]}, one moment`);
			// get the account id by username
			wot.get('account/list', { search: args[0] }).then((userList) => {
				var accountID = userList.data[0].account_id;
				// get the account stats by username
				wot.get('account/info', { account_id: accountID }).then((userInfo) => {
					var userStatistics = userInfo.data[Object.keys(userInfo.data)[0]];
					var gameStatistics = userStatistics.statistics.all;
					console.log(gameStatistics);

					// last battle played
					var lastBattleTime = new Date(0); // The 0 there is the key, which sets the date to the epoch
					lastBattleTime.setUTCSeconds(userStatistics.last_battle_time);

					// games played
					var gamesPlayed = gameStatistics.battles;

					// win percentage
					var winPercentage = `${(gameStatistics.wins / gamesPlayed * 100).toFixed(2)}%`;

					// survived percentage
					var survivedPercentage = `${(gameStatistics.survived_battles / gamesPlayed * 100).toFixed(2)}%`;

					// average damage
					var averageDamage = (gameStatistics.damage_dealt / gamesPlayed).toFixed(2);

					// average kills
					var averageKills = (gameStatistics.frags / gamesPlayed).toFixed(2);

					// total trees cut
					var treesCut = userStatistics.trees_cut;

					// rich embed that we send
					var wotStats = new Discord.RichEmbed()
						.setAuthor(`WoT Statistics for ${args[0]}`, message.author.avatarURL)
						.addField(`Total Games Played`, gamesPlayed, true)
						.addField(`Win Rate`, winPercentage, true)
						.addField(`Survival Rate`, survivedPercentage, true)
						.addField(`Kills Per Game`, averageKills, true)
						.addField(`Damage Per Game`, averageDamage, true)
						.addField(`Last Battle`, formatDate(lastBattleTime), true)
						.setColor([219, 16, 41])
						.setFooter(`${treesCut} trees cut`)
						.setTimestamp();

					// send the embed
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
			var kickMember = message.mentions.members.first();

			// if no member is mentioned
			if (!kickMember) {
				message.reply('mention a user to kick them.');
				return;
			}

			var reason = args.slice(1).join(" ");
			kickMember.kick(reason).then(kickedMember => {
				message.reply(`${kickedMember.user.username} was kicked.`);
			});
		} else {
			message.reply('you do not have permission to kick other members.')
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
	const monthNames = [
		"January", "February", "March",
		"April", "May", "June", "July",
		"August", "September", "October",
		"November", "December" ];

	var day = date.getDate();
	var monthIndex = date.getMonth();
	var year = date.getFullYear();

	return monthNames[monthIndex] + ' ' + day + ', ' + year;
}

function serializeWn8(wn8Value) {
	var expFrag = wn8Value.expFrag;
	var expDamage = wn8Value.expDamage;
	var expSpot = wn8Value.expSpot;
	var expDef = wn8Value.expDef;
	var expWinRate = wn8Value.expWinRate;

	var wn8Obj = {expFrag: expFrag, expDamage: expDamage, expSpot: expSpot, expDef: expDef, expWinRate: expWinRate};

	return wn8Obj;
}

// Log the bot in using our token: https://discordapp.com/developers/applications/me/408384681004761108
client.login(config.token);