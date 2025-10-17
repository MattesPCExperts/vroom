module.exports = (sequelize, DataTypes) => {
    const Vehicle = sequelize.define('Vehicle', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        source: {
            type: DataTypes.STRING,
            allowNull: true
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        year: {
            type: DataTypes.STRING,
            allowNull: false
        },
        make: {
            type: DataTypes.STRING,
            allowNull: false
        },
        model: {
            type: DataTypes.STRING,
            allowNull: false
        },
        trim: {
            type: DataTypes.STRING
        },
        price: {
            type: DataTypes.STRING
        },
        mileage: {
            type: DataTypes.STRING
        },
        vin: {
            type: DataTypes.STRING
        },
        condition: {
            type: DataTypes.STRING
        },
        exteriorColor: {
            type: DataTypes.STRING
        },
        interiorColor: {
            type: DataTypes.STRING
        },
        transmission: {
            type: DataTypes.STRING
        },
        engine: {
            type: DataTypes.STRING
        },
        fuelType: {
            type: DataTypes.STRING
        },
        features: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            defaultValue: []
        },
        description: {
            type: DataTypes.TEXT
        },
        images: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            defaultValue: []
        },
        scrapedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {}
        }
    }, {
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['vin']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    Vehicle.associate = (models) => {
        Vehicle.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        Vehicle.hasMany(models.Post, {
            foreignKey: 'vehicleId',
            as: 'posts'
        });
        Vehicle.hasMany(models.Image, {
            foreignKey: 'vehicleId',
            as: 'vehicleImages'
        });
    };

    return Vehicle;
};

