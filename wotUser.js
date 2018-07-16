class wotUser {
	constructor(userName) {
		this.userName = userName;
		this.avgDmg = 0;
		this.avgSpot = 0;
		this.avgFrag = 0;
		this.avgDef = 0;
		this.avgWinRate = 0;
		this.treesCut = 0;
		this.gamesPlayed = 0;
		this.avgSurvivalRate = 0;
		this.lastBattle = new Date(0); // The 0 there is the key, which sets the date to the epoch

		this.totalExpDmg = 0;
		this.totalExpSpot = 0;
		this.totalExpFrag = 0;
		this.totalExpDef = 0;
		this.totalExpWinRate = 0;
		this.WN8 = 0;
	}

	setUserStatistics(rawUserInfo) {
		const userStatistics = rawUserInfo.data[Object.keys(rawUserInfo.data)[0]];
		const gameStatistics = userStatistics.statistics.all;

		// last battle played
		this.lastBattle = getDateFromUTC(userStatistics.last_battle_time);

		// games played
		this.gamesPlayed = gameStatistics.battles;

		// win percentage
		this.avgWinRate = gameStatistics.wins / this.gamesPlayed * 100;

		// survived percentage
		this.avgSurvivalRate = gameStatistics.survived_battles / this.gamesPlayed * 100;

		// average damage
		this.avgDmg = gameStatistics.damage_dealt / this.gamesPlayed;

		// average kills
		this.avgFrag = gameStatistics.frags / this.gamesPlayed;

		// avgerage spots
		this.avgSpot = gameStatistics.spotted / this.gamesPlayed;

		// average dropped capture points
		this.avgDef = gameStatistics.dropped_capture_points / this.gamesPlayed;

		// total trees cut
		this.treesCut = userStatistics.statistics.trees_cut;
	}

	setTankStatistics(tankInfo, wn8Values) {
		const tankStatistics = tankInfo.data[Object.keys(tankInfo.data)[0]];

		// calculate the full expectation values
		for (const tank of tankStatistics) {
			const tankId = tank.tank_id;
			const tankBattles = tank.statistics.battles;
			this.totalExpDmg += wn8Values[tankId].expDamage * tankBattles;
			this.totalExpSpot += wn8Values[tankId].expSpot * tankBattles;
			this.totalExpFrag += wn8Values[tankId].expFrag * tankBattles;
			this.totalExpDef += wn8Values[tankId].expDef * tankBattles;
			this.totalExpWinRate += wn8Values[tankId].expWinRate * tankBattles;
		}
	}

	calculateWN8() {
		const avgExpDmg = this.totalExpDmg / this.gamesPlayed;
		const avgExpSpot = this.totalExpSpot / this.gamesPlayed;
		const avgExpFrag = this.totalExpFrag / this.gamesPlayed;
		const avgExpDef = this.totalExpDef / this.gamesPlayed;
		const avgExpWinRate = this.totalExpWinRate / this.gamesPlayed;

		const rDAMAGE = this.avgDmg / avgExpDmg;
		const rSPOT = this.avgSpot / avgExpSpot;
		const rFRAG = this.avgFrag / avgExpFrag;
		const rDEF = this.avgDef / avgExpDef;
		const rWIN = this.avgWinRate / avgExpWinRate;

		const rWINc = Math.max(0, (rWIN - 0.71) / (1 - 0.71));
		const rDAMAGEc = Math.max(0, (rDAMAGE - 0.22) / (1 - 0.22));
		const rFRAGc = Math.max(0, Math.min(rDAMAGEc + 0.2, (rFRAG - 0.12) / (1 - 0.12)));
		const rSPOTc = Math.max(0, Math.min(rDAMAGEc + 0.1, (rSPOT - 0.38) / (1 - 0.38)));
		const rDEFc = Math.max(0, Math.min(rDAMAGEc + 0.1, (rDEF - 0.10) / (1 - 0.10)));

		this.WN8 = 980 * rDAMAGEc + 210 * rDAMAGEc * rFRAGc + 155 * rFRAGc * rSPOTc + 75 * rDEFc * rFRAGc + 145 * Math.min(1.8, rWINc);
	}
}

// date formatter
function getDateFromUTC(UTCSeconds) {
	let date = new Date(0);
	date.setUTCSeconds(UTCSeconds);

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

module.exports = wotUser;