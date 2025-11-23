import sequelize from './config/database.js';
import User from './models/User.js';

async function test() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        await sequelize.sync();
        console.log('Database synced.');

        const users = await User.findAll();
        console.log('Users found:', users.length);
        users.forEach(u => console.log(u.toJSON()));

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

test();
