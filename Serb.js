const { WorldOfTanks } = require('wargamer');
const Discord = require('discord.js');
const request = require('request');
const wotUser = require("./wotUser.js");

// Set where we get local vars
let env = process.env;

const fs = require('fs');
if (fs.existsSync("./config.json")) {
	env = require("./config.json");
}

// Fix for Heroku
var http = require('http'); 
http.createServer(function (req, res) { 
	res.writeHead(200, {'Content-Type': 'text/plain'}); 
	res.send('it is running\n'); 
}).listen(process.env.PORT || 5000);

// Create instance of Discord client
const client = new Discord.Client();
// Create instance of wot
const wot = new WorldOfTanks({realm: 'na', applicationId: env.WotID});

// WN8 values in a dictionary
const wn8Values = {};

// Make sure our bot is ready, commands will not execute until Serb is ready
// https://static.modxvm.com/wn8-data-exp/json/wn8exp.json
client.on('ready', () => {
	console.log(`Downloading expected tank values from https://static.modxvm.com/wn8-data-exp/json/wn8exp.json`);
	request(`https://static.modxvm.com/wn8-data-exp/json/wn8exp.json`, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			const wn8JSON = JSON.parse(body).data;

			for (const wn8Value of wn8JSON) {
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
	if (!message.content.startsWith(env.prefix) || message.author.bot) return;

	// separate our message into command and args
	const args = message.content.slice(env.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	// Check stats command. return if there are no args
	if (command === 'stats') {
		if (args.length === 0) {
			message.channel.send("The `!stats` command must be followed by a username");
		} else {
			const user = new wotUser(args[0]);
			message.channel.send(`Fetching stats for ${user.userName}, one moment`);

			// get the account id for statistics by username
			wot.get('account/list', { search: user.userName }).then((userList) => {
				const accountID = userList.data[0].account_id;

				// get the account stats by userID
				const userPromise = wot.get('account/info', { account_id: accountID }).then((userInfo) => {
					user.setUserStatistics(userInfo);
					return null;
				}).catch((error) => {
					console.log(error);
					message.reply(`I was unable to find WoT statistics for ${user.userName}`);
					return "error";
				});

				// get the account tank statistics by userID
				const tankPromise = wot.get('account/tanks', { account_id: accountID }).then((tankInfo) => {
					user.setTankStatistics(tankInfo, wn8Values);
					return null;
				}).catch((error) => {
					console.log(error);
					message.reply(`I was unable to find tank statistics for ${user.userName}`);
					return "error";
				});

				Promise.all([userPromise, tankPromise]).then((values) => {
					if (values.includes("error")) {
						message.reply(`Wargaming's API had a hiccup, try again!`);
					} else {
						user.calculateWN8();
						user.sendStatistics(message);
					}
				});
			}).catch((error) => {
				console.log(error);
				message.reply(`I was unable to find WoT data for ${user.userName}`);
				return;
			});
		}
	}

	// simple kick command
	if (command === 'kick') {
		// only users with the kick members permission may kick members
		if (message.guild.me.hasPermission("KICK_MEMBERS")) {
			const kickMember = message.mentions.members.first();
			console.log(kickMember)

			// if no member is mentioned
			if (!kickMember) {
				message.reply('mention a user to kick them.');
				return;
			}

			const reason = args.slice(1).join(" ");
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

function serializeWn8(wn8Value) {
	const expFrag = wn8Value.expFrag;
	const expDamage = wn8Value.expDamage;
	const expSpot = wn8Value.expSpot;
	const expDef = wn8Value.expDef;
	const expWinRate = wn8Value.expWinRate;

	const wn8Obj = {expFrag: expFrag, expDamage: expDamage, expSpot: expSpot, expDef: expDef, expWinRate: expWinRate};

	return wn8Obj;
}

// Log the bot in using our token: https://discordapp.com/developers/applications/me/408384681004761108
client.login(env.token).catch((error) => {
	console.log("ERROR: cannot connect to Discord server...");
});