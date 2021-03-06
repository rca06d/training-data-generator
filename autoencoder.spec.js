const fs = require('fs');
const path = require('path');
const nodeWav = require('node-wav');
const Promise = require('bluebird');
const fsReadFile = Promise.promisify(fs.readFile);
const AutoencoderDataGenerator = require('./autoencoder');
const TrainingDataReader = require('./training-ex-writers/TrainingDataReader');

const testMarkersPath = path.join(__dirname, './spec/markers.mid');
const testMarkersWavPath = path.join(__dirname, './spec/markers.wav');
const testWavFilePath = path.join(__dirname, './spec/test.wav');
const outputDir = path.join(__dirname, './tmp/autoencoder-test');

const expectedOutputPath = path.join(outputDir, './spec/test.wav.ndat');
const expectedLengthOut = 3;
const expectedSampleRateOut = 44100;
const expectedExampleLength = expectedSampleRateOut * expectedLengthOut;
const expectedNumExamples = 10;

describe('AutoencoderDataGenerator', function () {
	describe('createTrainingData', function () {
		beforeAll(function (done) {
			if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
			if (fs.existsSync(expectedOutputPath)) fs.unlinkSync(expectedOutputPath);

			const generator = new AutoencoderDataGenerator({
				outputDir,
				lengthOut: expectedLengthOut,
				desiredNumExamples: expectedNumExamples
			});

			return generator
				.createTrainingData(testWavFilePath, testMarkersPath)
				.then(done)
				.catch(done.fail);
		});

		it('writes example data file to correct location', function () {
			expect(fs.existsSync(expectedOutputPath)).toBeTruthy();
		});

		describe('data', function () {
			beforeAll(function (done) {
				buildExpectedExamples(testWavFilePath, testMarkersWavPath, expectedExampleLength, expectedNumExamples)
					.then(expectedExamples => {
						this.expectedExamples = expectedExamples;
					})
					.then(done)
					.catch(done.fail);
			});

			it(`writes raw feature set data correctly`, function () {
				const { X: featureSets } = TrainingDataReader.fromFile(expectedOutputPath);

				expect(featureSets.length).toBe(this.expectedExamples.length);
				this.expectedExamples.forEach(({ X: expectedFeatureSet }, i) => {
					expect(featureSets[i]).toEqual(expectedFeatureSet);
				});
			});

			it('writes label data correctly', function () {
				const { y: labelSets } = TrainingDataReader.fromFile(expectedOutputPath);

				expect(labelSets.length).toBe(this.expectedExamples.length);
				this.expectedExamples.forEach(({ y: expectedLabelSet }, i) => {
					expect(labelSets[i]).toEqual(expectedLabelSet);
				});
			});
		});
	});
});

function buildExpectedExamples(waveFilePath, markerFilePath, numFeatures, desiredNumExamples) {
	return Promise
		.all([
			decodeMedia(waveFilePath),
			decodeMedia(markerFilePath)
		])
		.then(([audioData, markerData]) => {
			const neededSpace = numFeatures * desiredNumExamples;
			const overlap = (neededSpace - audioData.length) / (desiredNumExamples - 1);
			const exampleOffset = Math.floor(numFeatures - overlap);
			const numExamples = Math.floor((audioData.length - numFeatures + exampleOffset) / exampleOffset);

			const examples = [];

			for (let i = 0, l = numExamples; i < l; i++) {
				const startPos = i * exampleOffset;
				const endPos = startPos + numFeatures;
				const features = audioData.slice(startPos, endPos);
				const labels = markerData.slice(startPos, endPos);
				examples.push({ X: features, y: labels });
			}

			return examples;
		});
}

function decodeMedia(filePath) {
	return fsReadFile(filePath)
		.then(nodeWav.decode)
		.then(d => d.channelData[0]);
}
