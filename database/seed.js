const db = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('Starting database seeding...');

        // Create admin user
        const adminExists = await db.User.findOne({ 
            where: { email: 'admin@vroomtool.com' } 
        });

        if (!adminExists) {
            const admin = await db.User.create({
                name: 'Admin User',
                email: 'admin@vroomtool.com',
                password: 'admin123456', // Will be hashed by model hook
                role: 'admin',
                isActive: true
            });

            await db.Subscription.create({
                userId: admin.id,
                tier: 'premium',
                status: 'active',
                postLimit: 999999
            });

            console.log('✓ Admin user created');
            console.log('  Email: admin@vroomtool.com');
            console.log('  Password: admin123456');
            console.log('  ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
        } else {
            console.log('✓ Admin user already exists');
        }

        // Create test user
        const testUserExists = await db.User.findOne({ 
            where: { email: 'test@example.com' } 
        });

        if (!testUserExists) {
            const testUser = await db.User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'test123456',
                role: 'user',
                isActive: true
            });

            await db.Subscription.create({
                userId: testUser.id,
                tier: 'free',
                status: 'active',
                postLimit: 10
            });

            // Create sample vehicle
            const vehicle = await db.Vehicle.create({
                userId: testUser.id,
                source: 'Manual Entry',
                year: '2023',
                make: 'Toyota',
                model: 'Camry',
                price: '$28,500',
                mileage: '15,000 miles',
                condition: 'Used',
                features: ['Leather Seats', 'Navigation', 'Backup Camera'],
                description: 'Excellent condition, one owner, fully serviced.'
            });

            // Create sample post
            await db.Post.create({
                userId: testUser.id,
                vehicleId: vehicle.id,
                content: 'Check out this amazing 2023 Toyota Camry! Excellent condition with only 15,000 miles. Features include leather seats, navigation, and backup camera. Contact us today! #Toyota #Camry #CarForSale',
                status: 'draft',
                platforms: ['facebook', 'twitter']
            });

            console.log('✓ Test user and sample data created');
            console.log('  Email: test@example.com');
            console.log('  Password: test123456');
        } else {
            console.log('✓ Test user already exists');
        }

        console.log('\n✓ Database seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('✗ Seeding failed:', error);
        process.exit(1);
    }
}

seed();

