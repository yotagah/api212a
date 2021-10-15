import express from 'express';
import fs from 'fs';
import { promisify } from 'util';
import winston from 'winston';
import accountsRouter from './routes/accounts.js';

const app = express()
const exists = promisify(fs.exists);
const writeFile = promisify(fs.writeFile);
const { combine, timestamp, label, printf } = winston.format;
const myFormat = printf(({ level, message, label, timestamp }) => {
	return `${timestamp} [${label}] ${level}: ${message}`;
});
global.fileName = 'accounts.json';

app.use(express.json());
app.use(express.static('public'));
app.use('/images', express.static('public'));
app.use('/account', accountsRouter);

global.logger = winston.createLogger({
	level: 'silly',
	transports: [
		new (winston.transports.Console)(),
		new (winston.transports.File)({ filename: 'accounts-control-api.log' })
	],
	format: combine(
		label({ label: 'accounts-control-api' }),
		timestamp(),
		myFormat
	)
});

app.listen(3000, async () => {
	try {
		const fileExists = await exists(global.fileName);
		if (!fileExists) {
			const initialJson = {
				nextId: 1,
				accounts: []
			};
			await writeFile(global.fileName, JSON.stringify(initialJson));
		}
	} catch (err) {
		logger.error(err);
	}
	logger.info('API started!');
});
