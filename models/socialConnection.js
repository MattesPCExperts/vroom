module.exports = (sequelize, DataTypes) => {
    const SocialConnection = sequelize.define('SocialConnection', {
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
        platform: {
            type: DataTypes.ENUM('facebook', 'instagram', 'twitter', 'linkedin'),
            allowNull: false
        },
        platformUserId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        platformUsername: {
            type: DataTypes.STRING
        },
        accessToken: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        refreshToken: {
            type: DataTypes.TEXT
        },
        tokenExpiresAt: {
            type: DataTypes.DATE
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        permissions: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
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
                fields: ['platform']
            },
            {
                unique: true,
                fields: ['userId', 'platform']
            }
        ]
    });

    SocialConnection.associate = (models) => {
        SocialConnection.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    SocialConnection.prototype.isTokenValid = function() {
        if (!this.tokenExpiresAt) return true;
        return new Date() < new Date(this.tokenExpiresAt);
    };

    return SocialConnection;
};

