module.exports = {
	sampleRateOut: 44100,
	numExamples: 50000,
	trainingExampleLength: 2048, // in samples
	minNegativeExampleBuffer: 50 // in samples, how close to a positive training example are we allowed to get while generating random negative examples
};
