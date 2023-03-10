import mongoose from 'mongoose';

import { DATABASE_URL } from '$env/static/private';

console.log(DATABASE_URL);

async function loadMongoDB() {
	try {
		await mongoose.connect(DATABASE_URL);
	} catch (err) {
		console.log(err);
	}
}

loadMongoDB();
