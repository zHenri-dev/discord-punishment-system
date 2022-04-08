module.exports = class {
    constructor(client) {
        this.client = client;
        this.eventName = "guildMemberAdd";
    }

    async run(member) {
        let punishment = await this.client.database.punishments.findOne({ userId: member.id, type: "mute", performed: false, guildId: member.guild.id });
        if (punishment) member.roles.add(this.client.config.punishmentRoleId).catch(() => { });
    }
};