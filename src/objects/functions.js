module.exports = class Functions {
    constructor(client) {
        this.client = client;
    }

    async getFormatedTime(time) {
        try {
            time = parseInt(time);
            if (!time) return undefined;
            let formated = [];
            let days = Math.floor(time / (60 * 60 * 24 * 1000));
            if (days > 0) { time = time - (days * (60 * 60 * 24 * 1000)); if (days == 1) { formated.push(`${days} dia`) } else { formated.push(`${days} dias`) }; };
            let hours = Math.floor(time / (60 * 60 * 1000));
            if (hours > 0) { time = time - (hours * (60 * 60 * 1000)); if (hours == 1) { formated.push(`${hours} hora`) } else { formated.push(`${hours} horas`) }; };
            let minutes = Math.floor(time / (60 * 1000));
            if (minutes > 0) { time = time - (minutes * (60 * 1000)); if (minutes == 1) { formated.push(`${minutes} minuto`) } else { formated.push(`${minutes} minutos`) }; };
            let seconds = Math.floor(time / 1000);
            if (seconds > 0) { time = time - (seconds * (60 * 1000)); if (seconds == 1) { formated.push(`${seconds} segundo`) } else { formated.push(`${seconds} segundos`) }; };
            let returnString = formated.join(", ");
            if (formated.length > 1) {
                let last = formated.pop();
                returnString = formated.join(", ") + " e " + last;
            }
            return returnString;
        } catch (error) {
            console.log(error);
            console.log(`\x1b[91m[Functions] Ocorreu um erro ao executar a função getFormatedTime\x1b[0m`);
        }
    }

    async checkPunishments() {
        try {
            let punishments = await this.client.database.punishments.find({ performed: false });
            punishments.forEach(async punishment => {
                if (punishment.time != 0 && punishment.time + punishment.createdAt <= new Date().getTime()) {
                    punishment.performed = true;
                    punishment.save();
                    let guild = await this.client.guilds.cache.get(punishment.guildId);
                    let logGuild = await this.client.guilds.cache.get(punishment.logGuildId);
                    if (!logGuild || !guild) return;
                    let member = await guild.members.cache.get(punishment.userId);
                    let channel = await logGuild.channels.cache.get(punishment.logChannelId);
                    if (!channel) return;
                    let message = await channel.messages.fetch(punishment.logMessageId);
                    if (!message || !message.embeds[0]) return;
                    let newEmbed = message.embeds[0];
                    newEmbed.description = newEmbed.description.replace("O membro ainda está punido", "Cumprida integralmente pelo membro");
                    message.edit({ embeds: [newEmbed] }).catch(() => { });
                    if (punishment.type == "ban") guild.bans.remove(punishment.userId, "Punição retirada automaticamente pelo sistema").catch(() => { });
                    else if (member) member.roles.remove(this.client.config.punishmentRoleId, "Punição retirada automaticamente pelo sistema").catch(() => { });
                }
            });
        } catch (error) {
            console.log(error);
            console.log(`\x1b[91m[Functions] Ocorreu um erro ao executar a função checkPunishments\x1b[0m`);
        }
    }
};