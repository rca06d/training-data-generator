const SUPPORTED_ARTICULATIONS = [
	'SNARE',
	'SNARE_SIDESTICK',
	'SNARE_RIMSHOT',
	'SNARE_FLAM',
	'KICK',
	'TOM1',
	'TOM2',
	'TOM3',
	'TOM4',
	'TOM5',
	'TOM6',
	'HIHAT_CLOSED',
	'HIHAT_PEDAL',
	'HIHAT_OPEN',
	'HIHAT_OPEN_BELL',
	'CRASH1',
	'CRASH2',
	'RIDE_EDGE',
	'RIDE_BOW',
	'RIDE_BELL',
	'CHINA',
	'SPLASH',
	'COWBELL'
];

module.exports.ARTICULATIONS = SUPPORTED_ARTICULATIONS.reduce((map, name, i) => {
	map[name] = i;
	return map;
}, {});

module.exports.ARTICULATIONS.NO_HIT = -1;

module.exports.NUM_ARTICULATIONS = SUPPORTED_ARTICULATIONS.length;
