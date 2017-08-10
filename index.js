#!/usr/bin/env node

const commander = require('commander');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const config = require('./default.config');
const Markers = require('./markers');
const Audio = require('./audio');
const TrainingExWriter = require('./training-ex-writer');

commander
	.version('0.0.1')
	.option('-a, --audio [string]', 'Specify the path or glob to the audio file(s)', '/**/*.wav')
	.option('-m, --markers [string]', 'Specify the path to the marker midi file', '/markers.mid')
	.option('-o, --output-dir [string]', 'Specify the output directory for the data files')
	.option('-s, --offset [number]', 'Specify the offset used from each marker to save the actual example data', 0)
	.option('-r, --sample-rate [number]', 'Specify the sample rate of the training examples', config.sampleRateOut)
	.option('-l, --example-length [number]', 'Specify the length (ms) of each training example', config.trainingExampleLength)
	.option('-b, --example-buffer [number]', 'Specify the distance (in samples) a negative training example must be from all positive examples', config.minNegativeExampleBuffer)
	.parse(process.argv);

const sampleRateOut = commander.sampleRate;
const millisecondsOut = commander.exampleLength;
const sampleLengthOut = Math.round(sampleRateOut * (millisecondsOut / 1000));
const markerOffset = -parseInt(commander.offset);
const minNegativeExampleBuffer = commander.exampleBuffer;
const audioPath = path.join(process.cwd(), commander.audio);
const markerPath = path.join(process.cwd(), commander.markers);
const outputDir = commander.outputDir;

console.info(`Output info - Length: ${sampleLengthOut} (${millisecondsOut} ms), Sample Rate: ${sampleRateOut}`);

glob(audioPath, function (err, files) {
	if (err) return errAndExit(err);

	files.reduce((prevOp, filepath) => {
		return prevOp.then(() => createTrainingData(filepath, markerPath));
	}, Promise.resolve());
});

function createTrainingData(audioFilePath, markerFilePath) {
	return Audio
		.load(audioFilePath)
		.then(wavFile => {
			const audioDir = path.dirname(audioFilePath);
			const midiMapFilePath = path.join(audioDir, 'map.js');
			return Markers
				.fromFile(markerFilePath, midiMapFilePath, wavFile.sampleRate)
				.then(positiveMarkers => {
					const negativeMarkers = Markers.generateNegativeMarkers(positiveMarkers, minNegativeExampleBuffer);
					const allMarkers = positiveMarkers.concat(negativeMarkers);

					const audioData = wavFile.channelData[0];

					const writer = new TrainingExWriter(audioData, allMarkers);

					const cwdParentDir = path.join(process.cwd(), '..');
					const relativeAudioDir = path.relative(cwdParentDir, audioDir);
					const outputFolder = outputDir ? path.join(outputDir, relativeAudioDir) : audioDir;
					const outputFilePath = path.join(outputFolder, path.basename(audioFilePath));

					writer
						.transform(Audio.reversePolarity)
						.toFile(outputFilePath, sampleLengthOut, markerOffset);
				});
		})
		.catch(err => console.error("ERROR", err));
}

function errAndExit(err) {
	console.error(err);
	process.exit(1);
}
