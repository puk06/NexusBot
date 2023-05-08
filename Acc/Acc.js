module.exports.calcAccuracy = (good, ok, miss) => {
	const accuracy =
		((parseInt(good) + parseInt(ok) * 0.5) /
			(parseInt(good) + parseInt(ok) + parseInt(miss))) *
		100;
	return parseFloat(accuracy.toFixed(2));
}
