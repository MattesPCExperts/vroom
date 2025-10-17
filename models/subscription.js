module.exports = (sequelize, DataTypes) => {
    const Subscription = sequelize.define('Subscription', {
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
        tier: {
            type: DataTypes.ENUM('free', 'premium'),
            defaultValue: 'free'
        },
        status: {
            type: DataTypes.ENUM('active', 'cancelled', 'expired'),
            defaultValue: 'active'
        },
        startDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        endDate: {
            type: DataTypes.DATE
        },
        postsThisMonth: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        postLimit: {
            type: DataTypes.INTEGER,
            defaultValue: 10
        },
        lastResetDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        billingInfo: {
            type: DataTypes.JSONB,
            defaultValue: {}
        }
    }, {
        timestamps: true
    });

    Subscription.associate = (models) => {
        Subscription.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    Subscription.prototype.canCreatePost = function() {
        // Check if within post limit
        if (this.tier === 'premium') {
            return true;
        }
        return this.postsThisMonth < this.postLimit;
    };

    Subscription.prototype.incrementPostCount = async function() {
        // Reset counter if new month
        const now = new Date();
        const lastReset = new Date(this.lastResetDate);
        
        if (now.getMonth() !== lastReset.getMonth() || 
            now.getFullYear() !== lastReset.getFullYear()) {
            this.postsThisMonth = 0;
            this.lastResetDate = now;
        }
        
        this.postsThisMonth += 1;
        await this.save();
    };

    return Subscription;
};

