module.exports = (sequelize, DataTypes) => {
    const Image = sequelize.define('Image', {
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
        vehicleId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Vehicles',
                key: 'id'
            }
        },
        filename: {
            type: DataTypes.STRING,
            allowNull: false
        },
        originalName: {
            type: DataTypes.STRING
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        mimeType: {
            type: DataTypes.STRING
        },
        size: {
            type: DataTypes.INTEGER
        },
        width: {
            type: DataTypes.INTEGER
        },
        height: {
            type: DataTypes.INTEGER
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
                fields: ['vehicleId']
            }
        ]
    });

    Image.associate = (models) => {
        Image.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        Image.belongsTo(models.Vehicle, {
            foreignKey: 'vehicleId',
            as: 'vehicle'
        });
    };

    return Image;
};

