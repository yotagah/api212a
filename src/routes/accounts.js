import express from 'express';
import fs from 'fs';
import { promisify } from 'util';

const router = express.Router();
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

router.post('/', async (req, res) => {
	try {
		let account = req.body;

		if(typeof account.name !== 'string' || account.name === "") {
			throw new Error('The name is invalid!');
		}

		if(typeof account.balance !== 'number') {
			throw new Error('The balance is invalid!');
		}

		const data = JSON.parse(await readFile(global.fileName, 'utf8'));

		if(data.accounts.find(acc => acc.name === account.name) !== undefined) {
			throw new Error('Account name already exists!');
		}

		account = {
			id: data.nextId++,
			name: account.name,
			balance: account.balance,
			created: new Date()
		};

		data.accounts.push(account)

		await writeFile(global.fileName, JSON.stringify(data));

		res.send(account);

		logger.info(`POST /account - ${JSON.stringify(account)}`);
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

router.patch('/:id/deposit', async (req, res) => {
	try {
		const deposit = req.body;
		if(typeof deposit.amount !== 'number' || deposit.amount <= 0) {
			throw new Error('The amount is invalid!');
		}

		const data = JSON.parse(await readFile(global.fileName, 'utf8'));
		let accountIndex = data.accounts.findIndex(account => account.id === parseInt(req.params.id, 10));

		if (accountIndex >= 0) {
			data.accounts[accountIndex].balance += deposit.amount;
			data.accounts[accountIndex].balance = Math.round(data.accounts[accountIndex].balance * 100) / 100; // Fix float imprecision
			await writeFile(global.fileName, JSON.stringify(data));
			res.send({
				balance: data.accounts[accountIndex].balance
			});
		} else {
			throw new Error('Account does not exists!');
		}

		logger.info(`PATCH /account/${req.params.id}/deposit - ${JSON.stringify(deposit)}`);
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

router.patch('/:id/withdraw', async (req, res) => {
	try {
		const withdraw = req.body;
		if(typeof withdraw.amount !== 'number' || withdraw.amount <= 0) {
			throw new Error('The amount is invalid!');
		}

		const data = JSON.parse(await readFile(global.fileName, 'utf8'));
		let accountIndex = data.accounts.findIndex(account => account.id === parseInt(req.params.id, 10));

		if (accountIndex >= 0) {
			data.accounts[accountIndex].balance -= withdraw.amount;
			data.accounts[accountIndex].balance = Math.round(data.accounts[accountIndex].balance * 100) / 100; // Fix float imprecision

			if(data.accounts[accountIndex].balance < 0) {
				throw new Error('Insufficient account balance!');
			}

			await writeFile(global.fileName, JSON.stringify(data));
			res.send({
				balance: data.accounts[accountIndex].balance
			});
		} else {
			throw new Error('Account does not exists!');
		}

		logger.info(`PATCH /account/${req.params.id}/withdraw - ${JSON.stringify(withdraw)}`);
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

router.get('/:id/balance', async (req, res) => {
	try {
		const data = JSON.parse(await readFile(global.fileName, 'utf8'));
		const account = data.accounts.find(account => account.id === parseInt(req.params.id, 10));

		if (account) {
			res.send({
				balance: account.balance
			});
		} else {
			throw new Error('Account does not exists!');
		}

		logger.info(`GET /account/${req.params.id}/balance`);
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

router.delete('/:id', async (req, res) => {
	try {
		const data = JSON.parse(await readFile(global.fileName, 'utf8'));
		const account = data.accounts.find(account => account.id === parseInt(req.params.id, 10));

		if (account) {
			data.accounts = data.accounts.filter(account => account.id !== parseInt(req.params.id, 10));
			await writeFile(global.fileName, JSON.stringify(data));
			res.send(account);
		} else {
			throw new Error('Account does not exists!');
		}

		logger.info(`DELETE /account/${req.params.id} - ${JSON.stringify(account)}`);
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

export default router;
