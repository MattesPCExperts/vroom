const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('user', 'admin'),
            defaultValue: 'user'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        lastLoginAt: {
            type: DataTypes.DATE
        },
        preferences: {
            type: DataTypes.JSONB,
            defaultValue: {
                autoSave: true,
                notifications: true,
                defaultTone: 'professional',
                defaultLength: 'medium',
                includeHashtags: true,
                includeEmoji: true
            }
        }
    }, {
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        }
    });

    User.associate = (models) => {
        User.hasOne(models.Subscription, {
            foreignKey: 'userId',
            as: 'subscription'
        });
        User.hasMany(models.Vehicle, {
            foreignKey: 'userId',
            as: 'vehicles'
        });
        User.hasMany(models.Post, {
            foreignKey: 'userId',
            as: 'posts'
        });
        User.hasMany(models.SocialConnection, {
            foreignKey: 'userId',
            as: 'socialConnections'
        });
    };

    User.prototype.validatePassword = async function(password) {
        return await bcrypt.compare(password, this.password);
    };

    User.prototype.toJSON = function() {
        const values = { ...this.get() };
        delete values.password;
        return values;
    };

    return User;
};

