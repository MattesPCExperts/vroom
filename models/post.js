module.exports = (sequelize, DataTypes) => {
    const Post = sequelize.define('Post', {
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
            allowNull: false,
            references: {
                model: 'Vehicles',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        images: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            defaultValue: []
        },
        status: {
            type: DataTypes.ENUM('draft', 'published', 'scheduled', 'failed'),
            defaultValue: 'draft'
        },
        platforms: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        },
        publishedAt: {
            type: DataTypes.DATE
        },
        scheduledFor: {
            type: DataTypes.DATE
        },
        generationOptions: {
            type: DataTypes.JSONB,
            defaultValue: {
                tone: 'professional',
                length: 'medium',
                includeHashtags: true,
                includeEmoji: true
            }
        },
        publishResults: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        analytics: {
            type: DataTypes.JSONB,
            defaultValue: {
                views: 0,
                likes: 0,
                shares: 0,
                comments: 0
            }
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
            },
            {
                fields: ['status']
            },
            {
                fields: ['publishedAt']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    Post.associate = (models) => {
        Post.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        Post.belongsTo(models.Vehicle, {
            foreignKey: 'vehicleId',
            as: 'vehicle'
        });
    };

    return Post;
};

